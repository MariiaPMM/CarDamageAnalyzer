import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Keyboard,
	Platform,
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
import { useAnalysisFlow } from '@/context/analysis-flow-context';
import {
	askGeneralCarAssistantQuestion,
	type AnalysisChatMessage,
} from '@/lib/openai';

function formatChatTime() {
	return new Date().toLocaleTimeString('uk-UA', {
		hour: '2-digit',
		minute: '2-digit',
	});
}

type ChatUiMessage = AnalysisChatMessage & {
	time: string;
};

export default function ChatScreen() {
	const { result } = useAnalysisFlow();
	const insets = useSafeAreaInsets();
	const scrollRef = useRef<ScrollView | null>(null);
	const [messages, setMessages] = useState<ChatUiMessage[]>([]);
	const [question, setQuestion] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

	useEffect(() => {
		const showEvent =
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent =
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

		const showSubscription = Keyboard.addListener(showEvent, () => {
			setIsKeyboardVisible(true);
		});
		const hideSubscription = Keyboard.addListener(hideEvent, () => {
			setIsKeyboardVisible(false);
		});

		return () => {
			showSubscription.remove();
			hideSubscription.remove();
		};
	}, []);

	const introText = useMemo(() => {
		if (result) {
			return `Можеш уточнити звіт для ${result.vehicle.makeModel}: що означає сума, які пошкодження критичні та які фото ще варто додати.`;
		}

		return 'Постав будь-яке питання про авто, пошкодження або ремонт.';
	}, [result]);

	function scrollToEndSoon() {
		requestAnimationFrame(() => {
			scrollRef.current?.scrollToEnd({ animated: true });
		});
	}

	async function sendQuestion(rawQuestion: string) {
		const normalizedQuestion = rawQuestion.trim();
		if (!normalizedQuestion || isLoading) {
			return;
		}

		const userMessage: ChatUiMessage = {
			id: `${Date.now()}-user`,
			role: 'user',
			text: normalizedQuestion,
			time: formatChatTime(),
		};

		const nextHistory = [...messages, userMessage];

		setQuestion('');
		setError('');
		setIsLoading(true);
		setMessages(nextHistory);
		scrollToEndSoon();

		try {
			const answer = await askGeneralCarAssistantQuestion({
				question: normalizedQuestion,
				history: nextHistory,
				result,
			});

			setMessages(current => [
				...current,
				{
					id: `${Date.now()}-assistant`,
					role: 'assistant',
					text: answer,
					time: formatChatTime(),
				},
			]);
			scrollToEndSoon();
		} catch (requestError) {
			const message =
				requestError instanceof Error
					? requestError.message
					: 'Не вдалося отримати відповідь чату.';
			setError(message);
			setQuestion(normalizedQuestion);
			setMessages(current =>
				current.filter(item => item.id !== userMessage.id),
			);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<SafeAreaView
			style={styles.screen}
			edges={['top', 'left', 'right']}
		>
			<LinearGradient
				colors={[uiPalette.background, uiPalette.background]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.backgroundGradient}
			/>

			<View style={styles.screen}>
				<View style={[styles.header, { paddingTop: insets.top + 6 }]}>
					<ThemedText
						type="title"
						style={styles.title}
					>
						Чат
					</ThemedText>
				</View>

				<ScrollView
					ref={scrollRef}
					style={styles.chatScroll}
					contentContainerStyle={styles.chatContent}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{!messages.length ? (
						<View style={[styles.assistantRow, styles.introRow]}>
							<View style={styles.botIcon}>
								<MaterialIcons
									name="smart-toy"
									size={16}
									color={uiPalette.primaryPressed}
								/>
							</View>
							<View style={[styles.assistantCard, styles.introCard]}>
								<ThemedText style={styles.assistantLead}>
									Коротко і по суті:
								</ThemedText>
								<ThemedText style={styles.assistantText}>
									{introText}
								</ThemedText>
							</View>
						</View>
					) : null}

					{messages.map(message =>
						message.role === 'user' ? (
							<View
								key={message.id}
								style={styles.userRow}
							>
								<View style={styles.userBubble}>
									<ThemedText style={styles.userText}>
										{message.text}
									</ThemedText>
									<ThemedText style={styles.userTime}>
										{message.time} ✓✓
									</ThemedText>
								</View>
							</View>
						) : (
							<View
								key={message.id}
								style={styles.assistantRow}
							>
								<View style={styles.botIcon}>
									<MaterialIcons
										name="smart-toy"
										size={16}
										color={uiPalette.primaryPressed}
									/>
								</View>
								<View style={styles.assistantCard}>
									<ThemedText style={styles.assistantLead}>
										Відповідь:
									</ThemedText>
									<ThemedText style={styles.assistantText}>
										{message.text}
									</ThemedText>
									<ThemedText style={styles.assistantTime}>
										{message.time}
									</ThemedText>
								</View>
							</View>
						),
					)}

					{isLoading ? (
						<View style={styles.assistantRow}>
							<View style={styles.botIcon}>
								<MaterialIcons
									name="smart-toy"
									size={16}
									color={uiPalette.primaryPressed}
								/>
							</View>
							<View style={styles.assistantCard}>
								<ThemedText style={styles.assistantLead}>Відповідь:</ThemedText>
								<ThemedText style={styles.assistantText}>
									Готую відповідь...
								</ThemedText>
							</View>
						</View>
					) : null}

					{error ? (
						<View style={styles.errorBubble}>
							<ThemedText style={styles.errorText}>{error}</ThemedText>
						</View>
					) : null}
				</ScrollView>

				<View
					style={[
						styles.composerWrap,
						{
							bottom: isKeyboardVisible
								? Math.max(insets.bottom + 12, 18)
								: Math.max(insets.bottom, 6) + 86,
						},
					]}
				>
					<View style={styles.composerShell}>
						<TextInput
							value={question}
							onChangeText={setQuestion}
							placeholder="Напиши повідомлення..."
							placeholderTextColor={uiPalette.textSoft}
							style={styles.input}
							multiline
						/>
						<Pressable
							onPress={() => sendQuestion(question)}
							disabled={isLoading}
							style={[
								styles.sendButton,
								isLoading ? styles.sendButtonDisabled : undefined,
							]}
						>
							<LinearGradient
								colors={[uiPalette.primary, uiPalette.primaryStrong]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.sendButtonGradient}
							>
								<MaterialIcons
									name={isLoading ? 'hourglass-top' : 'arrow-upward'}
									size={18}
									color={uiPalette.onDark}
								/>
							</LinearGradient>
						</Pressable>
					</View>
				</View>
			</View>
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
		top: 80,
		right: -34,
		width: 220,
		height: 220,
		borderRadius: 110,
		backgroundColor: 'rgba(30, 136, 255, 0.2)',
	},
	glowTwo: {
		position: 'absolute',
		top: 250,
		left: -36,
		width: 190,
		height: 190,
		borderRadius: 95,
		backgroundColor: 'rgba(0, 163, 255, 0.12)',
	},
	header: {
		paddingHorizontal: 20,
		paddingBottom: 12,
	},
	title: {
		color: uiPalette.text,
		fontSize: 18,
		lineHeight: 24,
	},
	chatScroll: {
		flex: 1,
	},
	chatContent: {
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 150,
		gap: 14,
	},
	introRow: {
		marginTop: 4,
	},
	userRow: {
		alignItems: 'flex-end',
	},
	userBubble: {
		maxWidth: '78%',
		borderRadius: 18,
		borderTopRightRadius: 10,
		backgroundColor: uiPalette.primary,
		paddingHorizontal: 14,
		paddingVertical: 12,
		shadowColor: 'rgba(30, 136, 255, 0.55)',
		shadowOpacity: 0.25,
		shadowRadius: 14,
		shadowOffset: { width: 0, height: 6 },
	},
	userText: {
		color: uiPalette.onDark,
		fontSize: 14,
		lineHeight: 20,
	},
	userTime: {
		marginTop: 6,
		color: 'rgba(245, 248, 255, 0.76)',
		fontSize: 11,
		alignSelf: 'flex-end',
	},
	assistantRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 10,
		maxWidth: '96%',
	},
	botIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(18, 38, 78, 0.95)',
		borderWidth: 1,
		borderColor: 'rgba(100, 145, 220, 0.22)',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 8,
	},
	assistantCard: {
		flex: 1,
		borderRadius: 22,
		backgroundColor: 'rgba(16, 36, 73, 0.9)',
		borderWidth: 1,
		borderColor: 'rgba(100, 145, 220, 0.22)',
		paddingHorizontal: 16,
		paddingVertical: 14,
		shadowColor: '#000000',
		shadowOpacity: 0.2,
		shadowRadius: 14,
		shadowOffset: { width: 0, height: 10 },
	},
	introCard: {
		paddingTop: 15,
	},
	assistantLead: {
		color: uiPalette.textMuted,
		fontSize: 13,
		fontWeight: '600',
		marginBottom: 8,
	},
	assistantText: {
		color: uiPalette.text,
		fontSize: 14,
		lineHeight: 22,
	},
	assistantTime: {
		marginTop: 8,
		color: uiPalette.textSoft,
		fontSize: 11,
		alignSelf: 'flex-end',
	},
	errorBubble: {
		alignSelf: 'stretch',
		borderRadius: 18,
		paddingHorizontal: 14,
		paddingVertical: 12,
		backgroundColor: uiPalette.dangerSoft,
		borderWidth: 1,
		borderColor: uiPalette.danger,
	},
	errorText: {
		color: '#FF6B6B',
		lineHeight: 20,
	},
	composerWrap: {
		position: 'absolute',
		left: 0,
		right: 0,
		paddingHorizontal: 14,
		backgroundColor: 'transparent',
	},
	composerShell: {
		position: 'relative',
		justifyContent: 'center',
	},
	input: {
		minHeight: 54,
		maxHeight: 140,
		borderRadius: 27,
		borderWidth: 1,
		borderColor: 'rgba(85, 135, 210, 0.35)',
		backgroundColor: 'rgba(18, 38, 78, 0.75)',
		color: uiPalette.text,
		paddingLeft: 16,
		paddingRight: 58,
		paddingVertical: 15,
		fontSize: 14,
		lineHeight: 20,
		textAlignVertical: 'center',
	},
	sendButton: {
		position: 'absolute',
		right: 10,
		top: '50%',
		marginTop: -18,
		width: 36,
		height: 36,
		borderRadius: 18,
		overflow: 'hidden',
		shadowColor: 'rgba(30, 136, 255, 0.55)',
		shadowOpacity: 0.45,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 0 },
	},
	sendButtonGradient: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sendButtonDisabled: {
		opacity: 0.72,
	},
});
