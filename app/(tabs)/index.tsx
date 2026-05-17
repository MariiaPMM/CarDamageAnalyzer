import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	TextInput,
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
import {
	askDamageAnalysisQuestionSafe,
	type AnalysisChatMessage,
} from '@/lib/openai';

type DropdownKey = 'brand' | 'model' | 'year' | null;

const MAX_PHOTOS = 6;
const MAX_PHOTO_WIDTH = 1280;
const PHOTO_COMPRESS = 0.65;

type DropdownFieldProps = {
	label: string;
	icon: keyof typeof MaterialIcons.glyphMap;
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
	icon,
	value,
	placeholder,
	isOpen,
	onToggle,
	options,
	onSelect,
	disabled = false,
}: DropdownFieldProps) {
	const [searchValue, setSearchValue] = useState('');
	const inputRef = useRef<TextInput | null>(null);

	useEffect(() => {
		if (!isOpen) {
			setSearchValue('');
			return;
		}

		const timeoutId = setTimeout(() => {
			inputRef.current?.focus();
		}, 50);

		return () => clearTimeout(timeoutId);
	}, [isOpen]);

	const filteredOptions = useMemo(() => {
		const normalizedSearch = searchValue.trim().toLowerCase();

		if (!normalizedSearch) {
			return options;
		}

		return options.filter(option =>
			option.toLowerCase().includes(normalizedSearch),
		);
	}, [options, searchValue]);

	return (
		<View style={styles.inputGroup}>
			<View
				style={[
					styles.selectTrigger,
					disabled ? styles.selectTriggerDisabled : undefined,
				]}
			>
				<View style={styles.selectLeadingIcon}>
					<MaterialIcons
						name={icon}
						size={20}
						color={uiPalette.textSoft}
					/>
				</View>
				<View style={styles.selectTextWrap}>
					<ThemedText style={styles.selectFieldLabel}>{label}</ThemedText>
					<TextInput
						ref={inputRef}
						value={isOpen ? searchValue : value}
						onChangeText={setSearchValue}
						onFocus={() => {
							if (!disabled && !isOpen) {
								onToggle();
							}
						}}
						placeholder={placeholder}
						placeholderTextColor={uiPalette.textSoft}
						editable={!disabled}
						style={
							value || isOpen ? styles.selectValue : styles.selectPlaceholder
						}
					/>
				</View>
				<Pressable
					onPress={onToggle}
					disabled={disabled}
					hitSlop={8}
					style={styles.selectChevronButton}
				>
					<MaterialIcons
						name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
						size={20}
						color={uiPalette.primaryPressed}
					/>
				</Pressable>
			</View>

			{isOpen ? (
				<View style={styles.selectMenu}>
					<ScrollView
						nestedScrollEnabled
						style={styles.selectScroll}
					>
						{filteredOptions.length ? (
							filteredOptions.map(option => (
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
							))
						) : (
							<View style={styles.selectEmptyState}>
								<ThemedText style={styles.selectEmptyText}>
									Нічого не знайдено.
								</ThemedText>
							</View>
						)}
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
	const [messages, setMessages] = useState<AnalysisChatMessage[]>([]);
	const [question, setQuestion] = useState('');
	const [chatError, setChatError] = useState('');
	const [isChatLoading, setIsChatLoading] = useState(false);
	const [isChatModalOpen, setIsChatModalOpen] = useState(false);

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
			setFormError(
				'Не вдалося підготувати фото для аналізу. Спробуй інші знімки.',
			);
			return;
		}

		setPhotos(current => [...current, ...preparedPhotos]);

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
			allowsMultipleSelection: false,
			legacy: true,
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
		setMessages([]);
		setQuestion('');
		setChatError('');
		setIsChatLoading(false);
		setIsChatModalOpen(false);
	}

	async function handleSendMessage() {
		if (!result || isChatLoading) {
			return;
		}

		const normalizedQuestion = question.trim();
		if (!normalizedQuestion) {
			setChatError('Напиши запитання перед відправленням.');
			return;
		}

		const userMessage: AnalysisChatMessage = {
			id: `${Date.now()}-user`,
			role: 'user',
			text: normalizedQuestion,
		};

		const nextHistory = [...messages, userMessage];

		setQuestion('');
		setChatError('');
		setIsChatLoading(true);
		setMessages(nextHistory);

		try {
			const answer = await askDamageAnalysisQuestionSafe({
				result,
				question: normalizedQuestion,
				history: nextHistory,
			});

			setMessages(current => [
				...current,
				{
					id: `${Date.now()}-assistant`,
					role: 'assistant',
					text: answer,
				},
			]);
		} catch (requestError) {
			const message =
				requestError instanceof Error
					? requestError.message
					: 'Не вдалося отримати відповідь чату.';
			setChatError(message);
			setQuestion(normalizedQuestion);
			setMessages(current =>
				current.filter(item => item.id !== userMessage.id),
			);
		} finally {
			setIsChatLoading(false);
		}
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
		const hasDetectedDamage = result.validation.hasDamage;

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

					<View
						style={[
							styles.statusCard,
							hasDetectedDamage
								? styles.statusCardWarning
								: styles.statusCardSuccess,
						]}
					>
						<View style={styles.statusIconWrap}>
							<MaterialIcons
								name={hasDetectedDamage ? 'warning-amber' : 'verified'}
								size={28}
								color={
									hasDetectedDamage
										? (uiPalette.warning ?? '#F5C451')
										: uiPalette.primaryPressed
								}
							/>
						</View>
						<View style={styles.statusTextWrap}>
							<ThemedText style={styles.statusTitle}>
								{hasDetectedDamage
									? 'Пошкодження виявлено'
									: 'Пошкоджень не виявлено'}
							</ThemedText>
							<ThemedText style={styles.statusDescription}>
								{hasDetectedDamage
									? result.damageSummary
									: 'На наданих фото не видно чітких візуальних ознак пошкодження автомобіля.'}
							</ThemedText>
						</View>
					</View>

					{hasDetectedDamage ? (
						<>
							<View style={styles.sectionCard}>
								<ThemedText style={styles.sectionTitle}>
									Пошкоджені зони
								</ThemedText>
								<View style={styles.tagWrap}>
									{result.damagedZones.length ? (
										result.damagedZones.map(zone => (
											<View
												key={zone}
												style={styles.zoneTag}
											>
												<ThemedText style={styles.zoneTagText}>
													{zone}
												</ThemedText>
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
								<ThemedText style={styles.sectionTitle}>
									Ремонтні дії
								</ThemedText>
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
								<ThemedText style={styles.sectionTitle}>
									Орієнтовна вартість
								</ThemedText>
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

											<ThemedText style={styles.lineNote}>
												{item.note}
											</ThemedText>
										</View>
									))
								) : (
									<ThemedText style={styles.bodyText}>
										Деталізований кошторис відсутній.
									</ThemedText>
								)}
							</View>
						</>
					) : (
						<View style={styles.sectionCard}>
							<ThemedText style={styles.sectionTitle}>Рекомендація</ThemedText>
							<ThemedText style={styles.bodyText}>
								Якщо є сумніви, зроби ще кілька фото крупним планом при кращому
								освітленні або відкрий чат для уточнення.
							</ThemedText>
						</View>
					)}

					{false ? (
						<View style={styles.sectionCard}>
							<View style={styles.chatHeader}>
								<ThemedText style={styles.sectionTitle}>Чат</ThemedText>
							</View>

							<View style={styles.chatMessages}>
								{messages.length ? (
									messages.map(message => (
										<View
											key={message.id}
											style={[
												styles.chatBubble,
												message.role === 'user'
													? styles.userBubble
													: styles.assistantBubble,
											]}
										>
											<ThemedText
												style={[
													styles.chatBubbleText,
													message.role === 'user'
														? styles.userBubbleText
														: styles.assistantBubbleText,
												]}
											>
												{message.text}
											</ThemedText>
										</View>
									))
								) : (
									<ThemedText style={styles.bodyText}>
										Запитай, наприклад: &quot;Що означає цей висновок?&quot; або &quot;Чому
										вартість 0 UAH?&quot;.
									</ThemedText>
								)}

								{isChatLoading ? (
									<View style={[styles.chatBubble, styles.assistantBubble]}>
										<ThemedText
											style={[
												styles.chatBubbleText,
												styles.assistantBubbleText,
											]}
										>
											Готую відповідь...
										</ThemedText>
									</View>
								) : null}
							</View>

							<View style={styles.chatComposer}>
								<TextInput
									value={question}
									onChangeText={setQuestion}
									placeholder="Постав уточнювальне запитання..."
									placeholderTextColor={uiPalette.textMuted}
									style={styles.chatInput}
									multiline
								/>
								<Pressable
									onPress={handleSendMessage}
									disabled={isChatLoading}
									style={[
										styles.primaryButton,
										isChatLoading ? styles.primaryButtonDisabled : undefined,
									]}
								>
									<ThemedText style={styles.primaryButtonText}>
										{isChatLoading ? 'Зачекай...' : 'Надіслати'}
									</ThemedText>
								</Pressable>
							</View>

							{chatError ? (
								<ThemedText style={styles.errorText}>{chatError}</ThemedText>
							) : null}
						</View>
					) : null}

					<View style={styles.footerCard}>
						<Pressable
							onPress={() => setIsChatModalOpen(true)}
							style={styles.secondaryButton}
						>
							<MaterialIcons
								name="forum"
								size={18}
								color={uiPalette.text}
							/>
							<ThemedText style={styles.secondaryButtonText}>
								Відкрити чат
							</ThemedText>
						</Pressable>

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

				<Modal
					visible={isChatModalOpen}
					transparent
					animationType="slide"
					onRequestClose={() => setIsChatModalOpen(false)}
				>
					<View style={styles.modalBackdrop}>
						<Pressable
							style={StyleSheet.absoluteFill}
							onPress={() => setIsChatModalOpen(false)}
						/>

						<View style={styles.chatModalSheet}>
							<View style={styles.chatModalHandle} />
							<View style={styles.chatModalHeader}>
								<View style={styles.chatModalTitleWrap}>
									<ThemedText style={styles.chatModalTitle}>Чат</ThemedText>
								</View>
								<Pressable
									onPress={() => setIsChatModalOpen(false)}
									style={styles.chatCloseButton}
								>
									<MaterialIcons
										name="close"
										size={20}
										color={uiPalette.text}
									/>
								</Pressable>
							</View>

							<ScrollView
								style={styles.chatModalMessagesScroll}
								contentContainerStyle={styles.chatMessages}
								showsVerticalScrollIndicator={false}
							>
								{messages.length ? (
									messages.map(message => (
										<View
											key={message.id}
											style={[
												styles.chatBubble,
												message.role === 'user'
													? styles.userBubble
													: styles.assistantBubble,
											]}
										>
											<ThemedText
												style={[
													styles.chatBubbleText,
													message.role === 'user'
														? styles.userBubbleText
														: styles.assistantBubbleText,
												]}
											>
												{message.text}
											</ThemedText>
										</View>
									))
								) : (
									<View style={styles.chatHintCard}>
										<ThemedText style={styles.chatHintTitle}>
											Спробуй запитати
										</ThemedText>
										<ThemedText style={styles.bodyText}>
											Що означає висновок, чи треба ще фото, або які пошкодження
											тут видно.
										</ThemedText>
									</View>
								)}

								{isChatLoading ? (
									<View style={[styles.chatBubble, styles.assistantBubble]}>
										<ThemedText
											style={[
												styles.chatBubbleText,
												styles.assistantBubbleText,
											]}
										>
											Готую відповідь...
										</ThemedText>
									</View>
								) : null}
							</ScrollView>

							<View style={styles.chatComposer}>
								<TextInput
									value={question}
									onChangeText={setQuestion}
									placeholder="Постав уточнювальне запитання..."
									placeholderTextColor={uiPalette.textMuted}
									style={styles.chatInput}
									multiline
								/>
								<Pressable
									onPress={handleSendMessage}
									disabled={isChatLoading}
									style={[
										styles.primaryButton,
										isChatLoading ? styles.primaryButtonDisabled : undefined,
									]}
								>
									<ThemedText style={styles.primaryButtonText}>
										{isChatLoading ? 'Зачекай...' : 'Надіслати'}
									</ThemedText>
								</Pressable>
							</View>

							{chatError ? (
								<ThemedText style={styles.errorText}>{chatError}</ThemedText>
							) : null}
						</View>
					</View>
				</Modal>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={styles.screen}
			edges={['top', 'left', 'right']}
		>
			<LinearGradient
				colors={['#061028', '#0B1C4D', '#0B1742', '#08112C']}
				locations={[0, 0.28, 0.68, 1]}
				start={{ x: 0, y: 0.04 }}
				end={{ x: 1, y: 1 }}
				style={styles.backgroundGradient}
			/>
			<View style={styles.glowOne} />
			<View style={styles.glowTwo} />
			<ScrollView
				style={styles.screen}
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: 112 + Math.max(insets.bottom, 12) },
				]}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.topBar}>
					<ThemedText style={styles.topBarTitle}>Аналіз</ThemedText>
					<Pressable style={styles.topBarAction}>
						<MaterialIcons
							name="auto-awesome"
							size={20}
							color={uiPalette.primaryPressed}
						/>
					</Pressable>
				</View>
				<View style={styles.headerBlock}>
					<ThemedText
						type="title"
						style={styles.headerTitle}
					>
						Розумний аналіз авто
					</ThemedText>
					<ThemedText style={styles.headerSubtitle}>
						Додай фото авто — застосунок сформує звіт з оцінкою
						пошкоджень і ремонту.
					</ThemedText>
				</View>

				<View style={styles.sectionHeader}>
					<ThemedText style={styles.sectionHeading}>Дані про авто</ThemedText>
					<ThemedText style={styles.sectionDescription}>
						Заповни для точнішого результату.
					</ThemedText>
				</View>

				<DropdownField
					label="Марка"
					icon="directions-car"
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
					icon="airport-shuttle"
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
					icon="calendar-month"
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
										Додай до 6 фото авто
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
					Рекомендовано: перед, зад, боки та крупний план пошкодження.
				</ThemedText>


				<View style={styles.photoGrid}>
					<Pressable
						onPress={handleAddPhoto}
						style={styles.addPhotoTile}
					>
						<View style={styles.addPhotoCircle}>
							<MaterialIcons
								name="photo-camera"
								size={28}
								color={uiPalette.primaryPressed}
							/>
						</View>
						<ThemedText style={styles.addPhotoLabel}>Додати фото</ThemedText>
						<ThemedText style={styles.addPhotoHint}>
							Перетягни файли або натисни
						</ThemedText>
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
				</View>

				{formError ? (
					<ThemedText style={styles.errorText}>{formError}</ThemedText>
				) : null}
				{photos.length ? (
					<ThemedText style={styles.readyHintText}>
						Фото додано. Можеш додати ще або запустити AI-аналіз.
					</ThemedText>
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
	backgroundGradient: {
		...StyleSheet.absoluteFillObject,
	},
	glowOne: {
		position: 'absolute',
		top: 24,
		right: -34,
		width: 260,
		height: 260,
		borderRadius: 130,
		backgroundColor: 'rgba(18, 59, 138, 0.42)',
	},
	glowTwo: {
		position: 'absolute',
		top: 210,
		left: -26,
		width: 190,
		height: 190,
		borderRadius: 95,
		backgroundColor: 'rgba(0, 163, 255, 0.12)',
	},
	content: {
		paddingHorizontal: 20,
		paddingTop: 20,
		gap: 20,
	},
	resultContent: {
		paddingHorizontal: 18,
		paddingTop: 26,
		gap: 18,
	},
	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	topBarTitle: {
		color: uiPalette.text,
		fontSize: 18,
		lineHeight: 22,
		fontWeight: '700',
	},
	topBarAction: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(18, 38, 78, 0.75)',
		borderWidth: 1,
		borderColor: 'rgba(30, 136, 255, 0.35)',
		shadowColor: uiPalette.primary,
		shadowOpacity: 0.4,
		shadowRadius: 20,
		shadowOffset: { width: 0, height: 0 },
	},
	headerBlock: {
		gap: 8,
		marginBottom: 12,
	},
	headerTitle: {
		color: uiPalette.text,
		fontSize: 28,
		lineHeight: 32,
		fontWeight: '800',
	},
	headerSubtitle: {
		color: uiPalette.textMuted,
		lineHeight: 20,
		maxWidth: 250,
		fontSize: 14,
	},
	sectionHeader: {
		gap: 6,
		marginTop: 2,
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
		gap: 0,
	},
	inputLabel: {
		color: uiPalette.textMuted,
		fontSize: 12,
		textTransform: 'uppercase',
		letterSpacing: 1.1,
	},
	selectTrigger: {
		minHeight: 52,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: uiPalette.borderStrong,
		backgroundColor: 'rgba(18, 38, 78, 0.75)',
		paddingHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		shadowColor: uiPalette.primary,
		shadowOpacity: 0.1,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
	},
	selectLeadingIcon: {
		width: 28,
		alignItems: 'center',
		justifyContent: 'center',
	},
	selectTextWrap: {
		flex: 1,
		gap: 2,
		paddingLeft: 12,
		paddingRight: 8,
	},
	selectFieldLabel: {
		color: uiPalette.textSoft,
		fontSize: 12,
		lineHeight: 14,
	},
	selectChevronButton: {
		width: 28,
		alignItems: 'flex-end',
		justifyContent: 'center',
		paddingVertical: 4,
	},
	selectTriggerDisabled: {
		opacity: 0.45,
	},
	selectValue: {
		color: uiPalette.text,
		flex: 1,
		fontSize: 15,
		paddingVertical: 0,
		lineHeight: 20,
	},
	selectPlaceholder: {
		color: uiPalette.textSoft,
		flex: 1,
		fontSize: 15,
		paddingVertical: 0,
		lineHeight: 20,
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
	selectEmptyState: {
		paddingHorizontal: 18,
		paddingVertical: 18,
	},
	selectEmptyText: {
		color: uiPalette.textMuted,
		lineHeight: 20,
	},
	photoTitleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 12,
	},
	photoTitleText: {
		flex: 1,
		minWidth: 0,
	},
	counterBubble: {
		backgroundColor: 'rgba(30, 136, 255, 0.18)',
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderWidth: 1,
		borderColor: 'rgba(30, 136, 255, 0.55)',
	},
	counterText: {
		color: uiPalette.primaryPressed,
		fontWeight: '700',
		fontSize: 13,
	},
	photoGuideText: {
		color: uiPalette.textMuted,
		lineHeight: 21,
		fontSize: 13,
	},
	addPhotoTile: {
		width: '100%',
		minHeight: 142,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingHorizontal: 18,
		paddingVertical: 24,
		borderRadius: 20,
		backgroundColor: 'rgba(10, 25, 55, 0.65)',
		borderWidth: 1.5,
		borderColor: 'rgba(30, 136, 255, 0.75)',
		borderStyle: 'dashed',
		shadowColor: '#2F8CFF',
		shadowOpacity: 0.22,
		shadowRadius: 24,
		shadowOffset: { width: 0, height: 0 },
	},
	addPhotoCircle: {
		width: 52,
		height: 52,
		borderRadius: 14,
		backgroundColor: uiPalette.primary,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#49A6FF',
		shadowOpacity: 0.65,
		shadowRadius: 20,
		shadowOffset: { width: 0, height: 0 },
	},
	addPhotoLabel: {
		color: uiPalette.text,
		fontSize: 16,
		fontWeight: '600',
	},
	addPhotoHint: {
		color: uiPalette.textMuted,
		fontSize: 12,
		lineHeight: 18,
		textAlign: 'center',
	},
	photoTile: {
		position: 'relative',
		width: '31.5%',
		borderRadius: 20,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: uiPalette.border,
		backgroundColor: uiPalette.surface,
	},
	photoPreview: {
		width: '100%',
		height: 132,
		backgroundColor: uiPalette.photoPlaceholder,
	},
	photoGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
		alignItems: 'flex-start',
	},
	removeIconButton: {
		position: 'absolute',
		top: 8,
		right: 8,
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
	readyHintText: {
		color: uiPalette.primaryPressed,
		lineHeight: 21,
		paddingHorizontal: 4,
		fontWeight: '600',
	},
	analyzeButton: {
		minHeight: 60,
		borderRadius: 999,
		backgroundColor: uiPalette.primary,
		borderWidth: 0,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 12,
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
	statusCard: {
		flexDirection: 'row',
		gap: 14,
		borderRadius: 26,
		padding: 18,
		borderWidth: 1,
	},
	statusCardSuccess: {
		backgroundColor: uiPalette.primarySoft,
		borderColor: uiPalette.borderStrong,
	},
	statusCardWarning: {
		backgroundColor: uiPalette.surface,
		borderColor: uiPalette.borderStrong,
	},
	statusIconWrap: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: uiPalette.surfaceElevated,
		alignItems: 'center',
		justifyContent: 'center',
	},
	statusTextWrap: {
		flex: 1,
		gap: 6,
	},
	statusTitle: {
		color: uiPalette.text,
		fontSize: 22,
		lineHeight: 26,
		fontWeight: '800',
	},
	statusDescription: {
		color: uiPalette.text,
		lineHeight: 22,
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
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(6, 12, 32, 0.58)',
		justifyContent: 'flex-end',
	},
	chatModalSheet: {
		maxHeight: '86%',
		backgroundColor: uiPalette.background,
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		paddingHorizontal: 18,
		paddingTop: 12,
		paddingBottom: 18,
		gap: 14,
		borderTopWidth: 1,
		borderColor: uiPalette.borderStrong,
	},
	chatModalHandle: {
		width: 52,
		height: 5,
		borderRadius: 999,
		backgroundColor: uiPalette.borderStrong,
		alignSelf: 'center',
	},
	chatModalHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		gap: 12,
	},
	chatModalTitleWrap: {
		flex: 1,
		gap: 4,
	},
	chatModalTitle: {
		color: uiPalette.text,
		fontSize: 22,
		lineHeight: 26,
		fontWeight: '800',
	},
	chatModalSubtitle: {
		color: uiPalette.textMuted,
		lineHeight: 21,
	},
	chatCloseButton: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: uiPalette.surfaceElevated,
		borderWidth: 1,
		borderColor: uiPalette.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	chatModalMessagesScroll: {
		maxHeight: 320,
	},
	chatHeader: {
		gap: 8,
	},
	chatMessages: {
		gap: 10,
	},
	chatBubble: {
		maxWidth: '92%',
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	userBubble: {
		alignSelf: 'flex-end',
		backgroundColor: uiPalette.primary,
	},
	assistantBubble: {
		alignSelf: 'flex-start',
		backgroundColor: uiPalette.surfaceElevated,
		borderWidth: 1,
		borderColor: uiPalette.borderStrong,
	},
	chatBubbleText: {
		lineHeight: 22,
	},
	userBubbleText: {
		color: uiPalette.onDark,
	},
	assistantBubbleText: {
		color: uiPalette.text,
	},
	chatComposer: {
		gap: 12,
	},
	chatInput: {
		minHeight: 96,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: uiPalette.border,
		backgroundColor: uiPalette.surfaceElevated,
		color: uiPalette.text,
		paddingHorizontal: 14,
		paddingVertical: 12,
		textAlignVertical: 'top',
		fontSize: 16,
		lineHeight: 22,
	},
	chatHintCard: {
		backgroundColor: uiPalette.surfaceElevated,
		borderRadius: 20,
		padding: 14,
		gap: 8,
		borderWidth: 1,
		borderColor: uiPalette.borderStrong,
	},
	chatHintTitle: {
		color: uiPalette.text,
		fontSize: 16,
		fontWeight: '700',
	},
	primaryButtonDisabled: {
		opacity: 0.65,
	},
	footerCard: {
		gap: 12,
		paddingBottom: 8,
	},
	secondaryButton: {
		minHeight: 56,
		borderRadius: 999,
		backgroundColor: uiPalette.surfaceElevated,
		borderWidth: 1,
		borderColor: uiPalette.borderStrong,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
	},
	secondaryButtonText: {
		color: uiPalette.text,
		fontWeight: '700',
		fontSize: 16,
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
