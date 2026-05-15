import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	View,
} from 'react-native';
import {
	SafeAreaView,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { uiPalette } from '@/constants/ui-palette';
import {
	useAnalysisFlow,
	type PickedPhoto,
} from '@/context/analysis-flow-context';
import { useAuth } from '@/context/auth-context';
import {
	VEHICLE_BRANDS,
	VEHICLE_OPTIONS,
	VEHICLE_YEARS,
	type VehicleBrand,
} from '@/data/vehicle-options';

type DropdownKey = 'brand' | 'model' | 'year' | null;

const MAX_PHOTOS = 6;
const MAX_PHOTO_WIDTH = 1280;
const PHOTO_COMPRESS = 0.65;

type DropdownFieldProps = {
	label: string;
	value: string;
	placeholder: string;
	isOpen: boolean;
	onToggle: () => void;
	options: readonly string[];
	onSelect: (value: string) => void;
	disabled?: boolean;
};

function DropdownField({
	label,
	value,
	placeholder,
	isOpen,
	onToggle,
	options,
	onSelect,
	disabled = false,
}: DropdownFieldProps) {
	return (
		<View style={styles.inputGroup}>
			<ThemedText style={styles.inputLabel}>{label}</ThemedText>
			<Pressable
				onPress={onToggle}
				disabled={disabled}
				style={[
					styles.selectTrigger,
					disabled ? styles.selectTriggerDisabled : undefined,
				]}
			>
				<ThemedText
					style={value ? styles.selectValue : styles.selectPlaceholder}
				>
					{value || placeholder}
				</ThemedText>
				<MaterialIcons
					name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
					size={20}
					color={uiPalette.primaryPressed}
				/>
			</Pressable>

			{isOpen ? (
				<View style={styles.selectMenu}>
					<ScrollView
						nestedScrollEnabled
						style={styles.selectScroll}
					>
						{options.map(option => (
							<Pressable
								key={option}
								onPress={() => onSelect(option)}
								style={({ pressed }) => [
									styles.selectOption,
									pressed ? styles.selectOptionPressed : undefined,
								]}
							>
								<ThemedText style={styles.selectOptionText}>
									{option}
								</ThemedText>
							</Pressable>
						))}
					</ScrollView>
				</View>
			) : null}
		</View>
	);
}

export default function AnalyzeScreen() {
	const insets = useSafeAreaInsets();
	const { session } = useAuth();
	const { result, error, isAnalyzing, submitDraft, resetFlow } =
		useAnalysisFlow();
	const [brand, setBrand] = useState('');
	const [model, setModel] = useState('');
	const [year, setYear] = useState('');
	const [photos, setPhotos] = useState<PickedPhoto[]>([]);
	const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
	const [formError, setFormError] = useState('');

	const availableModels = useMemo(() => {
		if (!brand || !(brand in VEHICLE_OPTIONS)) {
			return [];
		}

		return VEHICLE_OPTIONS[brand as VehicleBrand];
	}, [brand]);

	function toggleDropdown(key: DropdownKey) {
		setOpenDropdown(current => (current === key ? null : key));
	}

	async function preparePhoto(
		asset: ImagePicker.ImagePickerAsset,
	): Promise<PickedPhoto | null> {
		try {
			const resizedImage = await ImageManipulator.manipulateAsync(
				asset.uri,
				[
					{
						resize: {
							width: MAX_PHOTO_WIDTH,
						},
					},
				],
				{
				base64: true,
				compress: PHOTO_COMPRESS,
				format: ImageManipulator.SaveFormat.JPEG,
				},
			);

			if (!resizedImage.base64) {
				return null;
			}

			return {
				uri: resizedImage.uri,
				mimeType: 'image/jpeg',
				base64: resizedImage.base64,
				fileName: asset.fileName,
			};
		} catch {
			return null;
		}
	}

	async function addAssets(assets: ImagePicker.ImagePickerAsset[]) {
		const validAssets = assets.filter(asset => asset.uri);

		if (!validAssets.length) {
			setFormError('Не вдалося прочитати вибрані файли. Спробуй інші фото.');
			return;
		}

		const availableSlots = MAX_PHOTOS - photos.length;

		if (availableSlots <= 0) {
			setFormError(`Можна додати до ${MAX_PHOTOS} фото на один аналіз.`);
			return;
		}

		const nextAssets = validAssets.slice(0, availableSlots);
		const preparedPhotos = (
			await Promise.all(nextAssets.map(asset => preparePhoto(asset)))
		).filter((photo): photo is PickedPhoto => photo !== null);

		if (!preparedPhotos.length) {
			setFormError('Не вдалося підготувати фото для аналізу. Спробуй інші знімки.');
			return;
		}

		setPhotos(current => [
			...current,
			...preparedPhotos,
		]);

		if (nextAssets.length < assets.length) {
			setFormError(
				`Додано ${nextAssets.length} фото. Ліміт на один аналіз: ${MAX_PHOTOS}.`,
			);
			return;
		}

		setFormError('');
	}

	async function handlePickPhoto() {
		setFormError('');

		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			Alert.alert(
				'Немає доступу',
				'Дозволь доступ до фото, щоб вибирати зображення для аналізу.',
			);
			return;
		}

		const pickerResult = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			quality: 0.8,
			allowsEditing: false,
			allowsMultipleSelection: true,
			selectionLimit: MAX_PHOTOS,
		});

		if (pickerResult.canceled || !pickerResult.assets.length) {
			return;
		}

		await addAssets(pickerResult.assets);
	}

	async function handleTakePhoto() {
		setFormError('');

		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) {
			Alert.alert(
				'Немає доступу',
				'Дозволь доступ до камери, щоб сфотографувати авто.',
			);
			return;
		}

		const cameraResult = await ImagePicker.launchCameraAsync({
			cameraType: ImagePicker.CameraType.back,
			quality: 0.8,
			allowsEditing: false,
		});

		if (cameraResult.canceled || !cameraResult.assets.length) {
			return;
		}

		await addAssets(cameraResult.assets);
	}

	function handleAddPhoto() {
		Alert.alert('Додати фото', 'Обери, як хочеш додати зображення.', [
			{ text: 'Скасувати', style: 'cancel' },
			{ text: 'Галерея', onPress: handlePickPhoto },
			{ text: 'Камера', onPress: handleTakePhoto },
		]);
	}

	function handleRemovePhoto(index: number) {
		setPhotos(current =>
			current.filter((_, currentIndex) => currentIndex !== index),
		);
	}

	async function handleAnalyze() {
		if (!photos.length) {
			setFormError('Додай хоча б одне фото авто перед запуском аналізу.');
			return;
		}

		setFormError('');
		await submitDraft(
			{
				brand,
				model,
				year,
				photos,
			},
			session?.email,
		);
	}

	function handleStartNew() {
		resetFlow();
		setBrand('');
		setModel('');
		setYear('');
		setPhotos([]);
		setOpenDropdown(null);
		setFormError('');
	}

	if (isAnalyzing) {
		return (
			<SafeAreaView
				style={styles.loadingScreen}
				edges={['top', 'left', 'right', 'bottom']}
			>
				<View style={styles.loadingCard}>
					<ActivityIndicator
						size="large"
						color={uiPalette.primaryPressed}
					/>
					<ThemedText style={styles.loadingTitle}>Готуємо звіт</ThemedText>
					<ThemedText style={styles.loadingText}>
						Перевіряємо фото, визначаємо пошкоджені зони та рахуємо орієнтовну
						вартість ремонту.
					</ThemedText>
				</View>
			</SafeAreaView>
		);
	}

	if (result) {
		return (
			<SafeAreaView
				style={styles.screen}
				edges={['top', 'left', 'right']}
			>
				<ScrollView
					style={styles.screen}
					contentContainerStyle={[
						styles.resultContent,
						{ paddingBottom: 112 + Math.max(insets.bottom, 12) },
					]}
				>
					<View style={styles.headerBlock}>
						<ThemedText
							type="title"
							style={styles.headerTitle}
						>
							Звіт по авто
						</ThemedText>
						<ThemedText style={styles.headerSubtitle}>
							{result.vehicle.makeModel}
						</ThemedText>
					</View>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.resultPhotoStrip}
					>
						{photos.map((photo, index) => (
							<Image
								key={`${photo.uri}-${index}`}
								source={{ uri: photo.uri }}
								style={styles.resultPhoto}
								contentFit="cover"
							/>
						))}
					</ScrollView>

					<View style={styles.sectionCard}>
						<ThemedText style={styles.sectionTitle}>Пошкоджені зони</ThemedText>
						<View style={styles.tagWrap}>
							{result.damagedZones.length ? (
								result.damagedZones.map(zone => (
									<View
										key={zone}
										style={styles.zoneTag}
									>
										<ThemedText style={styles.zoneTagText}>{zone}</ThemedText>
									</View>
								))
							) : (
								<ThemedText style={styles.bodyText}>
									Не вдалося чітко визначити зони.
								</ThemedText>
							)}
						</View>
					</View>

					<View style={styles.sectionCard}>
						<ThemedText style={styles.sectionTitle}>Ремонтні дії</ThemedText>
						{result.repairActions.length ? (
							result.repairActions.map(action => (
								<View
									key={action}
									style={styles.bulletRow}
								>
									<View style={styles.bulletDot} />
									<ThemedText style={styles.bodyText}>{action}</ThemedText>
								</View>
							))
						) : (
							<ThemedText style={styles.bodyText}>
								Список робіт не повернувся.
							</ThemedText>
						)}
					</View>

					<View style={styles.sectionCard}>
						<ThemedText style={styles.sectionTitle}>Орієнтовна вартість</ThemedText>
						<ThemedText style={styles.totalPriceValue}>
							{result.estimatedCost.amount} {result.estimatedCost.currency}
						</ThemedText>
						<ThemedText style={styles.bodyText}>
							{result.estimatedCost.note}
						</ThemedText>
					</View>

					<View style={styles.sectionCard}>
						<ThemedText style={styles.sectionTitle}>
							Кошторис по деталях
						</ThemedText>
						{result.lineItems.length ? (
							result.lineItems.map((item, index) => (
								<View
									key={`${item.part}-${index}`}
									style={styles.lineItemCard}
								>
									<ThemedText style={styles.lineItemTitle}>
										{item.part}
									</ThemedText>
									<ThemedText style={styles.lineMeta}>
										Зона: {item.zone}
									</ThemedText>
									<ThemedText style={styles.lineMeta}>
										Пошкодження: {item.damage}
									</ThemedText>
									<ThemedText style={styles.lineMeta}>
										Операція: {item.work}
									</ThemedText>

									<View style={styles.priceRow}>
										<View style={styles.priceChip}>
											<ThemedText style={styles.priceChipLabel}>
												Деталь
											</ThemedText>
											<ThemedText style={styles.priceChipValue}>
												{item.partPrice} {item.currency}
											</ThemedText>
										</View>
										<View style={styles.priceChip}>
											<ThemedText style={styles.priceChipLabel}>
												Робота
											</ThemedText>
											<ThemedText style={styles.priceChipValue}>
												{item.laborPrice} {item.currency}
											</ThemedText>
										</View>
									</View>

									<ThemedText style={styles.lineNote}>{item.note}</ThemedText>
								</View>
							))
						) : (
							<ThemedText style={styles.bodyText}>
								Деталізований кошторис відсутній.
							</ThemedText>
						)}
					</View>

					<View style={styles.footerCard}>
						<Pressable
							onPress={handleStartNew}
							style={styles.primaryButton}
						>
							<ThemedText style={styles.primaryButtonText}>
								Створити новий аналіз
							</ThemedText>
						</Pressable>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={styles.screen}
			edges={['top', 'left', 'right']}
		>
			<ScrollView
				style={styles.screen}
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: 112 + Math.max(insets.bottom, 12) },
				]}
			>
				<View style={styles.headerBlock}>
					<ThemedText
						type="title"
						style={styles.headerTitle}
					>
						Розумний аналіз фото авто
					</ThemedText>
					<ThemedText style={styles.headerSubtitle}>
						Додай фото авто, а застосунок сформує зрозумілий звіт із оцінкою
						ремонту.
					</ThemedText>
				</View>

				<View style={styles.sectionHeader}>
					<ThemedText style={styles.sectionHeading}>Дані про авто</ThemedText>
					<ThemedText style={styles.sectionDescription}>
						Для кращої точності відповіді рекомендовано ввести наступні дані.
					</ThemedText>
				</View>

				<DropdownField
					label="Марка"
					value={brand}
					placeholder="Обери марку"
					isOpen={openDropdown === 'brand'}
					onToggle={() => toggleDropdown('brand')}
					options={VEHICLE_BRANDS}
					onSelect={value => {
						setBrand(value);
						setModel('');
						setOpenDropdown(null);
					}}
				/>

				<DropdownField
					label="Модель"
					value={model}
					placeholder={brand ? 'Обери модель' : 'Спочатку обери марку'}
					isOpen={openDropdown === 'model'}
					onToggle={() => toggleDropdown('model')}
					options={availableModels}
					onSelect={value => {
						setModel(value);
						setOpenDropdown(null);
					}}
					disabled={!brand}
				/>

				<DropdownField
					label="Рік"
					value={year}
					placeholder="Обери рік"
					isOpen={openDropdown === 'year'}
					onToggle={() => toggleDropdown('year')}
					options={VEHICLE_YEARS}
					onSelect={value => {
						setYear(value);
						setOpenDropdown(null);
					}}
				/>

				<View style={styles.sectionHeader}>
					<View style={styles.photoTitleRow}>
						<View style={styles.photoTitleText}>
							<ThemedText style={styles.sectionHeading}>Фото авто</ThemedText>
							<ThemedText style={styles.sectionDescription}>
								Додай кілька чітких ракурсів кузова для точнішого аналізу.
							</ThemedText>
						</View>
						<View style={styles.counterBubble}>
							<ThemedText style={styles.counterText}>
								{photos.length}/{MAX_PHOTOS}
							</ThemedText>
						</View>
					</View>
				</View>

				<ThemedText style={styles.photoGuideText}>
					Рекомендовані фото: передня частина, задня частина, лівий і правий
					бік, а також окремий крупний план пошкодження.
				</ThemedText>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.photoScrollerContent}
					style={styles.photoScroller}
				>
					<Pressable
						onPress={handleAddPhoto}
						style={styles.addPhotoTile}
					>
						<View style={styles.addPhotoCircle}>
							<MaterialIcons
								name="add"
								size={30}
								color={uiPalette.primaryPressed}
							/>
						</View>
						<ThemedText style={styles.addPhotoLabel}>Додати фото</ThemedText>
					</Pressable>

					{photos.map((photo, index) => (
						<View
							key={`${photo.uri}-${index}`}
							style={styles.photoTile}
						>
							<Image
								source={{ uri: photo.uri }}
								style={styles.photoPreview}
								contentFit="cover"
							/>
							<Pressable
								onPress={() => handleRemovePhoto(index)}
								style={styles.removeIconButton}
							>
								<MaterialIcons
									name="close"
									size={16}
									color={uiPalette.onDark}
								/>
							</Pressable>
							<View style={styles.photoFooter}>
								<ThemedText
									style={styles.photoName}
									numberOfLines={1}
								>
									{photo.fileName || `Фото ${index + 1}`}
								</ThemedText>
							</View>
						</View>
					))}
				</ScrollView>

				{formError ? (
					<ThemedText style={styles.errorText}>{formError}</ThemedText>
				) : null}
				{error ? (
					<ThemedText style={styles.errorText}>{error}</ThemedText>
				) : null}

				<Pressable
					onPress={handleAnalyze}
					style={styles.analyzeButton}
				>
					<ThemedText style={styles.analyzeButtonText}>
						Запустити AI-аналіз
					</ThemedText>
				</Pressable>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: uiPalette.background,
	},
	content: {
		paddingHorizontal: 18,
		paddingTop: 26,
		gap: 16,
	},
	resultContent: {
		paddingHorizontal: 18,
		paddingTop: 26,
		gap: 18,
	},
	headerBlock: {
		gap: 10,
		marginBottom: 8,
	},
	headerTitle: {
		color: uiPalette.text,
		fontSize: 30,
		lineHeight: 34,
		fontWeight: '800',
	},
	headerSubtitle: {
		color: uiPalette.textMuted,
		lineHeight: 22,
		maxWidth: 300,
	},
	sectionHeader: {
		gap: 4,
		marginTop: 4,
	},
	sectionHeading: {
		color: uiPalette.text,
		fontSize: 17,
		lineHeight: 22,
		fontWeight: '700',
	},
	sectionDescription: {
		color: uiPalette.textMuted,
		lineHeight: 21,
	},
	inputGroup: {
		gap: 8,
	},
	inputLabel: {
		color: uiPalette.textMuted,
		fontSize: 12,
		textTransform: 'uppercase',
		letterSpacing: 1.1,
	},
	selectTrigger: {
		minHeight: 58,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: uiPalette.borderStrong,
		backgroundColor: uiPalette.surfaceMuted,
		paddingHorizontal: 18,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		shadowColor: uiPalette.primary,
		shadowOpacity: 0.22,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
	},
	selectTriggerDisabled: {
		opacity: 0.45,
	},
	selectValue: {
		color: uiPalette.text,
		flex: 1,
		fontSize: 16,
	},
	selectPlaceholder: {
		color: uiPalette.textSoft,
		flex: 1,
		fontSize: 16,
	},
	selectMenu: {
		borderRadius: 20,
		borderWidth: 1,
		borderColor: uiPalette.border,
		backgroundColor: uiPalette.surfaceElevated,
		overflow: 'hidden',
	},
	selectScroll: {
		maxHeight: 220,
	},
	selectOption: {
		paddingHorizontal: 18,
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: uiPalette.border,
	},
	selectOptionPressed: {
		backgroundColor: uiPalette.primarySoft,
	},
	selectOptionText: {
		color: uiPalette.text,
	},
	photoTitleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: 12,
		flexWrap: 'wrap',
	},
	photoTitleText: {
		flex: 1,
		minWidth: 0,
	},
	counterBubble: {
		backgroundColor: uiPalette.primarySoft,
		borderRadius: 999,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: uiPalette.borderStrong,
	},
	counterText: {
		color: uiPalette.primaryPressed,
		fontWeight: '700',
		fontSize: 13,
	},
	photoGuideText: {
		color: uiPalette.textMuted,
		lineHeight: 20,
	},
	photoScroller: {
		marginHorizontal: -2,
	},
	photoScrollerContent: {
		gap: 12,
		paddingHorizontal: 2,
	},
	addPhotoTile: {
		width: 156,
		minHeight: 196,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		padding: 16,
		borderRadius: 24,
		backgroundColor: uiPalette.surface,
		borderWidth: 1,
		borderColor: uiPalette.border,
	},
	addPhotoCircle: {
		width: 62,
		height: 62,
		borderRadius: 31,
		backgroundColor: uiPalette.primarySoft,
		borderWidth: 1,
		borderColor: uiPalette.borderStrong,
		alignItems: 'center',
		justifyContent: 'center',
	},
	addPhotoLabel: {
		color: uiPalette.textMuted,
		fontSize: 14,
		fontWeight: '600',
	},
	photoTile: {
		position: 'relative',
		width: 156,
		borderRadius: 24,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: uiPalette.border,
		backgroundColor: uiPalette.surface,
	},
	photoPreview: {
		width: 156,
		height: 196,
		backgroundColor: uiPalette.photoPlaceholder,
	},
	removeIconButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: uiPalette.overlay,
		alignItems: 'center',
		justifyContent: 'center',
	},
	photoFooter: {
		position: 'absolute',
		left: 10,
		right: 10,
		bottom: 10,
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 12,
		backgroundColor: uiPalette.overlay,
	},
	photoName: {
		color: uiPalette.onDark,
		fontSize: 12,
		fontWeight: '600',
	},
	errorText: {
		color: uiPalette.danger,
		lineHeight: 21,
		paddingHorizontal: 4,
	},
	analyzeButton: {
		minHeight: 60,
		borderRadius: 999,
		backgroundColor: uiPalette.primary,
		borderWidth: 0,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 8,
		shadowColor: uiPalette.primary,
		shadowOpacity: 0.34,
		shadowRadius: 22,
		shadowOffset: { width: 0, height: 12 },
	},
	analyzeButtonText: {
		color: uiPalette.onDark,
		fontWeight: '700',
		fontSize: 16,
	},
	loadingScreen: {
		flex: 1,
		backgroundColor: uiPalette.background,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
	},
	loadingCard: {
		width: '100%',
		borderRadius: 32,
		paddingHorizontal: 24,
		paddingVertical: 28,
		backgroundColor: uiPalette.surfaceElevated,
		borderWidth: 1,
		borderColor: uiPalette.border,
		alignItems: 'center',
		gap: 16,
	},
	loadingTitle: {
		color: uiPalette.text,
		fontSize: 28,
		lineHeight: 32,
		fontWeight: '700',
		textAlign: 'center',
	},
	loadingText: {
		color: uiPalette.textMuted,
		lineHeight: 22,
		textAlign: 'center',
	},
	resultPhotoStrip: {
		gap: 12,
		paddingRight: 4,
	},
	resultPhoto: {
		width: 220,
		height: 220,
		borderRadius: 26,
		backgroundColor: uiPalette.photoPlaceholder,
	},
	sectionCard: {
		backgroundColor: uiPalette.surface,
		borderRadius: 26,
		padding: 18,
		gap: 12,
		borderWidth: 1,
		borderColor: uiPalette.border,
		shadowColor: uiPalette.primary,
		shadowOpacity: 0.2,
		shadowRadius: 22,
		shadowOffset: { width: 0, height: 12 },
	},
	sectionTitle: {
		color: uiPalette.text,
		fontSize: 20,
		lineHeight: 24,
		fontWeight: '700',
	},
	tagWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	zoneTag: {
		backgroundColor: uiPalette.primarySoft,
		borderRadius: 999,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: uiPalette.borderStrong,
	},
	zoneTagText: {
		color: uiPalette.primaryPressed,
		fontWeight: '600',
	},
	bulletRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 10,
	},
	bulletDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: uiPalette.primary,
		marginTop: 8,
	},
	bodyText: {
		color: uiPalette.text,
		lineHeight: 23,
		flex: 1,
	},
	totalPriceValue: {
		color: uiPalette.text,
		fontSize: 38,
		lineHeight: 42,
		fontWeight: '800',
	},
	lineItemCard: {
		backgroundColor: uiPalette.surfaceElevated,
		borderRadius: 20,
		padding: 16,
		gap: 8,
		borderWidth: 1,
		borderColor: uiPalette.borderStrong,
	},
	lineItemTitle: {
		color: uiPalette.text,
		fontSize: 18,
		lineHeight: 22,
		fontWeight: '700',
	},
	lineMeta: {
		color: uiPalette.textMuted,
		lineHeight: 21,
	},
	priceRow: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 4,
	},
	priceChip: {
		flex: 1,
		backgroundColor: uiPalette.primarySoft,
		borderRadius: 16,
		padding: 12,
		gap: 2,
		borderWidth: 1,
		borderColor: uiPalette.borderStrong,
	},
	priceChipLabel: {
		color: uiPalette.textMuted,
		fontSize: 12,
		textTransform: 'uppercase',
		fontWeight: '700',
	},
	priceChipValue: {
		color: uiPalette.text,
		fontSize: 16,
		fontWeight: '700',
	},
	lineNote: {
		color: uiPalette.textMuted,
		lineHeight: 21,
	},
	footerCard: {
		gap: 12,
		paddingBottom: 8,
	},
	footerNote: {
		color: uiPalette.textMuted,
		lineHeight: 22,
	},
	primaryButton: {
		minHeight: 56,
		borderRadius: 999,
		backgroundColor: uiPalette.primary,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: uiPalette.primary,
		shadowOpacity: 0.3,
		shadowRadius: 20,
		shadowOffset: { width: 0, height: 10 },
	},
	primaryButtonText: {
		color: uiPalette.dark,
		fontWeight: '700',
		fontSize: 16,
	},
});
