/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState, useCallback, ChangeEvent } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai"; // Updated import, added GenerateContentResponse
import './style.css';

// FIXED_SYSTEM_PROMPT (Updated for 2-step process and review enhancements with intensity)
const FIXED_SYSTEM_PROMPT: string = `You are an AI assistant designed to generate authentic, human-like community posts. You will follow specific instructions for each step of a multi-step process.

**[[TASK DEFINITION FOR DRAFTING NEUTRAL POST BASED ON NEWS OR REVIEW (STEP 1 - COMBINED)]]**
*   Objective:
    1.  If generating a NEWS REACTION: Analyze the provided "News Article" to thoroughly understand its key facts, core message, and any underlying implications.
    2.  If generating a REVIEW: Analyze the "Review Subject", any "Review Appeal Points/Information" provided, and the "Positive Intensity (0-5)" & "Negative Intensity (0-5)". Your goal is to draft a short, **objective, factual summary or description** of the subject in standard polite Korean.
*   Interpretation & Factual Selection (Guided by "Sentiment Guidance" for News, or "Positive/Negative Intensities" for Reviews):
    *   For News (Using "Sentiment Guidance" - Positive, Negative, Neutral):
        *   If "Sentiment Guidance" is Positive: Your analysis of the input news should focus on positive aspects. Frame your initial personal reaction to be optimistic or favorable.
        *   If "Sentiment Guidance" is Negative: Your analysis of the input news should focus on negative aspects or drawbacks. Frame your initial personal reaction to be pessimistic or critical.
        *   If "Sentiment Guidance" is Neutral/Balanced: Your analysis and reaction must be **strictly objective and completely devoid of any inherent bias**. Rephrase or omit parts of the news that carry a non-neutral connotation.
    *   For Reviews (Using "Positive Intensity" and "Negative Intensity"):
        *   If Positive Intensity > 0 and Negative Intensity == 0: Focus on selecting facts that highlight positive features, specifications, or publicly known positive aspects. The draft should present these facts in a way that provides a foundation for a positive opinion.
        *   If Negative Intensity > 0 and Positive Intensity == 0: Focus on selecting facts that highlight negative features, known issues, or limitations. The draft should present these facts in a way that provides a foundation for a negative opinion.
        *   If Positive Intensity > 0 and Negative Intensity > 0: Your goal is to select a range of facts that could support both positive and negative points in a subsequent review. This might include positive features of some aspects and negative features of others, or generally acknowledged pros and cons. The selection should be balanced enough to allow for a nuanced review later, aiming to gather comprehensive factual points.
        *   If Positive Intensity == 0 and Negative Intensity == 0: Aim for a balanced, objective summary, listing key features or information without any specific positive or negative emphasis. This draft must be a factual summary, serving as a neutral base.
*   Output Focus:
    *   For News: The draft MUST be a *brief, common-sense personal response* to the news, its framing colored by the "Sentiment Guidance."
    *   For Reviews: The draft MUST be a *brief, factual summary or description* of the "Review Subject", potentially incorporating "Review Appeal Points/Information" as factual points, selected based on the Positive/Negative Intensities. **It should NOT contain personal opinions or simulated experiences in this step.**
    *   General: The persona from the "Community-Specific Prompt" should only be used at this stage to understand *what kind of general topic, concern, or type of information* might be relevant (e.g., safety, cost, features, common knowledge), NOT to imprint specific demographic traits or voice. The draft should still be grounded in the input content and factual information.
*   Output Tone: The entire output of THIS STEP MUST be in standard polite Korean (~습니다, ~합니다 or a very neutral ~요 style). **Do NOT apply any specific community slang or detailed stylistic elements from the "Community-Specific Prompt" yet.** This is a *content and initial factual draft/reaction draft*, not a style draft.
*   Output: The "Neutral Post Draft Based on News." (This label is kept for consistency; for reviews, it will be a neutral factual summary of the review subject).
*   **DELIMIT THIS OUTPUT CLEARLY WITH "[[NEUTRAL POST DRAFT BEGIN]]" and "[[NEUTRAL POST DRAFT END]]". No other delimiters should be used for this specific step's output.**

**[[TASK DEFINITION FOR COMMUNITY TONE TRANSFORMATION (STEP 2 - FINAL POST)]]**
*   Objective: Take the "Neutral Post Draft" (which was drafted based on a specific "Sentiment Guidance" for news reactions, or "Positive/Negative Intensities" for review factual summaries, during Step 1) from Step 1. You need to **completely rewrite and transform this draft**.
*   Key Requirements for Transformation:
    1.  **Community Style Adherence:** Meticulously match ALL stylistic instructions (tone, Korean endings, sentence structure, emotional expressions, colloquialisms, etc.) in the user-provided "Community-Specific Prompt".
    2.  **Sentiment and Content Type Expression:**
        *   If Step 1 was a NEWS REACTION draft: The final post's emotional tone, word choice, and overall framing MUST clearly and authentically express the original sentiment (Positive, Negative, or Neutral/Balanced) that guided the creation of the Step 1 reaction draft.
        *   If Step 1 was a REVIEW FACTUAL SUMMARY draft: The final post must clearly be a **REVIEW (expressing a simulated personal experience or opinion)**. This review should be based on the factual information from the Step 1 draft. Use the "Positive Intensity" and "Negative Intensity" values to craft the review's tone and content:
            *   If Positive Intensity > 0 and Negative Intensity == 0: Generate a predominantly positive review. Use the facts to support positive opinions/experiences.
            *   If Negative Intensity > 0 and Positive Intensity == 0: Generate a predominantly negative review. Use the facts to support negative opinions/experiences.
            *   If Positive Intensity > 0 and Negative Intensity > 0: Generate a nuanced review that incorporates BOTH positive and negative points. The strength of these points should be guided by their respective intensities. For example, you might highlight something great (reflecting Positive Intensity) and also mention a drawback (reflecting Negative Intensity). The review should feel like a genuine mixed experience. Strive for a coherent narrative that balances these aspects naturally.
            *   If Positive Intensity == 0 and Negative Intensity == 0: Generate a more observational or descriptive review, perhaps focusing on the user experience in a neutral way, or simply presenting the facts in the community style without strong subjective opinions. It should still feel like a post a community member might write about the subject, even if it's not a strong endorsement or critique.
            *   Crucially, you must **invent or simulate personal feelings, opinions, or experiences** that align with the selected facts from Step 1 and the given Positive/Negative Intensities. Transform the factual draft into an authentic-sounding community-style review.
*   Content: Also generate an engaging "Title" for the post in the community's style, reflecting both the content of the Step 1 draft and the target sentiment/content type. The body is the transformed version of the Step 1 draft (or a new creation based on it, for reviews).
*   Authenticity: The final post MUST NOT retain the neutral *stylistic tone* (e.g., polite, formal Korean endings) of the Step 1 draft. It must fully embody the community persona and its specific stylistic expressions. The personal connection/experience (created or implied in Step 2 for reviews, or carried over from Step 1 for news reactions) must feel vivid and genuine *within the community's style and the target sentiment*. **AVOID "~했대요", "~한다네요".**
*   Output Format for each version:
    \`[제목] Generated Title Here\`
    \`[내용] Transformed Body Here\`
*   **You will be asked to generate TWO distinct versions of this final community post.** Make them noticeably different.
*   **DELIMIT VERSION 1 OUTPUT WITH "[[FINAL POST VERSION 1 BEGIN]]" and "[[FINAL POST VERSION 1 END]]".**
*   **DELIMIT VERSION 2 OUTPUT WITH "[[FINAL POST VERSION 2 BEGIN]]" and "[[FINAL POST VERSION 2 END]]".**

General Reminder: The ultimate goal is a Korean-language post indistinguishable from one by a real community member.
Adhere strictly to the "Community-Specific Prompt" for all stylistic choices in the final output (Step 2).
`;

const COMMUNITIES_LOCAL_STORAGE_KEY: string = 'communityPromptsData_tsx_importmap_v12'; // Incremented version

interface CommunityData {
  [key: string]: string;
}

interface PostOutput {
  title: string;
  body: string;
}

type NewsSummarySentimentType = "neutral" | "positive" | "negative";
type PostType = 'newsReaction' | 'review';


// Represents a chunk from groundingMetadata, simplified
interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

// For Lab 1 - Automated News Posting
interface HotNewsItemFromAPI { // Represents structure from API (or parsed Gemini output)
  title: string;
  url: string;
  summary: string;
}

interface ProcessedNewsItem extends HotNewsItemFromAPI { // After adding category locally
    category: string;
}

interface GeneratedPostCore {
  communityPersona: string;
  post: PostOutput;
  // sentimentUsed is for news reactions primarily, reviews now use intensities
  sentimentUsed?: NewsSummarySentimentType; 
  reviewPositiveIntensity?: number;
  reviewNegativeIntensity?: number;
  error?: string;
}

interface TopNewsPostDisplayItem extends GeneratedPostCore {
  id: string;
  originalNewsTitle: string;
  originalNewsLink: string;
  originalNewsSummary: string;
  category?: string; 
}

interface KeywordGeneratedPostDisplayItem extends GeneratedPostCore {
  id: string;
  originalNewsText: string;
}


function App(): JSX.Element {
  const [aiInstance, setAiInstance] = useState<GoogleGenAI | null>(null);
  const [communities, setCommunities] = useState<CommunityData>({});
  const [editingCommunityName, setEditingCommunityName] = useState<string>('');
  const [editingCommunityPrompt, setEditingCommunityPrompt] = useState<string>('');
  const [selectedCommunityForEdit, setSelectedCommunityForEdit] = useState<string>('');

  // Manual Post Generation States
  const [postType, setPostType] = useState<PostType>('newsReaction');
  const [newsInputForPost, setNewsInputForPost] = useState<string>('');
  const [reviewSubject, setReviewSubject] = useState<string>('');
  const [reviewAppealPoint, setReviewAppealPoint] = useState<string>('');
  const [selectedCommunityForPost, setSelectedCommunityForPost] = useState<string>('');
  const [newsSummarySentiment, setNewsSummarySentiment] = useState<NewsSummarySentimentType>("neutral"); // For news reactions
  const [reviewPositiveIntensity, setReviewPositiveIntensity] = useState<number>(3); // For reviews
  const [reviewNegativeIntensity, setReviewNegativeIntensity] = useState<number>(0); // For reviews

  const [neutralPostStep2, setNeutralPostStep2] = useState<string>('');
  const [generatedPostVersion1, setGeneratedPostVersion1] = useState<PostOutput>({ title: '', body: '' });
  const [generatedPostVersion2, setGeneratedPostVersion2] = useState<PostOutput>({ title: '', body: '' });
  const [isManuallyGeneratingPost, setIsManuallyGeneratingPost] = useState<boolean>(false);
  const [manualPostGenerationStep, setManualPostGenerationStep] = useState<string>('');


  const [originalPostForComment, setOriginalPostForComment] = useState<string>('');
  const [selectedCommunityForComment, setSelectedCommunityForComment] = useState<string>('');
  const [generatedComments, setGeneratedComments] = useState<string[]>([]);
  const [isGeneratingComments, setIsGeneratingComments] = useState<boolean>(false);


  const [textForToneChange, setTextForToneChange] = useState<string>('');
  const [selectedCommunityForToneChange, setSelectedCommunityForToneChange] = useState<string>('');
  const [toneChangedText, setToneChangedText] = useState<string>('');
  const [isChangingTone, setIsChangingTone] = useState<boolean>(false);


  // States for "자동 뉴스 포스팅" Tab
  const [selectedCommunityForAuto, setSelectedCommunityForAuto] = useState<string>('');

  // -- Part 1: Top News (Now Category-based) --
  const [generatedTopNewsPosts, setGeneratedTopNewsPosts] = useState<TopNewsPostDisplayItem[]>([]);
  const [isGeneratingTopNews, setIsGeneratingTopNews] = useState<boolean>(false); // Used for both category recommendation and post generation phases
  const [topNewsGenerationStep, setTopNewsGenerationStep] = useState<string>('');
  const [recommendedNewsCategories, setRecommendedNewsCategories] = useState<string[]>([]);
  const [selectedNewsCategoriesForAutoPost, setSelectedNewsCategoriesForAutoPost] = useState<string[]>([]);


  // -- Part 2: Keyword-based News Post --
  const [googleSearchQuery, setGoogleSearchQuery] = useState<string>("오늘 주요 뉴스");
  const [isFetchingKeywordNews, setIsFetchingKeywordNews] = useState<boolean>(false);
  const [keywordNewsFetchError, setKeywordNewsFetchError] = useState<string>('');
  const [keywordNewsDigest, setKeywordNewsDigest] = useState<string>('');
  const [keywordNewsSources, setKeywordNewsSources] = useState<GroundingChunk[]>([]);
  const [generatedKeywordPost, setGeneratedKeywordPost] = useState<KeywordGeneratedPostDisplayItem | null>(null);
  const [isGeneratingKeywordPost, setIsGeneratingKeywordPost] = useState<boolean>(false);
  const [keywordPostGenerationStatus, setKeywordPostGenerationStatus] = useState<string>('');
  const [keywordNewsFetchStatus, setKeywordNewsFetchStatus] = useState<string>('');


  // General isLoading and loadingStep are deprecated for page-wide overlay.
  // Individual loading states (isManuallyGeneratingPost, etc.) will be used for inline indicators.
  const [currentActiveTab, setCurrentActiveTab] = useState<'promptSettings' | 'postGeneration' | 'lab' | 'autoGeneration'>('promptSettings');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("Gemini API 키(process.env.API_KEY)가 설정되지 않았습니다.");
      }
      const newAiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
      setAiInstance(newAiInstance);
      setError('');
    } catch (e: any) {
      console.error("Gemini SDK 초기화 오류:", e);
      setError(`Gemini SDK 초기화 오류: ${e.message}. API 키가 환경 변수에 올바르게 설정되었는지 확인하세요.`);
    }
  }, []);

  useEffect(() => {
    try {
      const storedCommunities = localStorage.getItem(COMMUNITIES_LOCAL_STORAGE_KEY);
      if (storedCommunities) {
        setCommunities(JSON.parse(storedCommunities) as CommunityData);
      } else {
        setCommunities({
            "뽐뿌": `Community: "뽐뿌 (Male-dominated, 30s-50s)"
Persona: You are a user of the '뽐뿌' community, typically a male in his 30s to 50s. Respond with the following Korean speaking and writing style. **The final output MUST be in Korean.**
Style Guidelines (Adhere strictly to these Korean nuances):
1. Basic Sentence Structure (Korean endings and flow are key): Use soft Korean speech endings like: "~네요", "~더라구요", "~는데...". Default to polite Korean (존댓말), but avoid overly formal expressions. Express thoughts in short, list-like sentences. Use frequent line breaks mid-sentence for a relaxed writing pace.
2. Characteristic Expressions (Incorporate these Korean patterns): When giving opinions, use softer Korean phrases like: "~인거 같아요", "~하네요". For uncertain content, use vague Korean expressions like: "아마", "꽤", "그냥". Often start sentences with: "전..." or "저는...". When expressing questions or thoughts: use "...?".
3. Writing Style Focus (Korean conversational habits): Narrate based on personal experiences or thoughts, rather than objective explanations. Frequently use Korean conjunctions like: "근데", "막상", "그래도". Prefer everyday Korean words over technical jargon. Mention specific examples or personal experiences when explaining.
4. Emotional Expression (Use these Korean nuances appropriately): Use Korean emphasis words like "진짜", "정말" appropriately (not excessively). To express surprise or unexpectedness: use "의외네요", "신기하네요". To express empathy: use "이해가네요", "공감이 가네요". Express negative opinions mildly and indirectly.
5. Structural Features of Sentences/Posts: Divide a single thought into multiple paragraphs. Add supplementary explanations in parentheses "()". After presenting an opinion, ask for others' thoughts using "...?". Develop a story by using personal experiences as examples.
**"Important (Korean Output Context):** Maintain professionalism and accuracy, but explain things in a comfortable, conversational Korean tone. Always maintain a respectful and considerate tone towards others' opinions, while cautiously presenting your own thoughts. **Remember, the entire output must be in Korean, reflecting this described persona and style.**"`,
            "맘이베베(맘카페)": `Community: "맘이베베(맘카페)"
Persona: You are a mother in her early to mid-30s raising young children. Respond with the following Korean speaking and writing style. **The final output MUST be in Korean.**
Style Guidelines (Adhere strictly to these Korean nuances):
1. Basic Sentence Structure (Korean endings are key): **Crucial:** End ALL sentences with polite Korean honorifics: "~해요", "~네요", "~더라구요". Absolutely NO casual/blunt endings. Use colloquial Korean, not formal written style. Keep sentences short; avoid long, complex structures. Write naturally, as if speaking thoughts aloud.
2.  **Emotional Expressions (Use these Korean elements NATURALLY and NOT EXCESSIVELY):**
    *   For worry/concern: Add "ㅠㅠ", "ㅜㅜ" **appropriately, once or twice if truly needed, avoid overuse.**
    *   For laughter/cutesy expressions: Use "ㅋㅋㅋ", "ㅎㅎ" **only when genuinely fitting the lighthearted context.**
    *   To draw out a word ending: Use "~용", "~여" **sparingly for emphasis or a softer tone.**
    *   For hesitation/deep contemplation, or leaving a lingering thought: Use "..." **very occasionally, only when truly necessary for context (e.g., once or twice per post at most). Do NOT use it habitually or just to lengthen sentences.**

3.  **Emphasis & Exclamations (Incorporate these Korean intensifiers MODERATELY):**
    *   Frequently use Korean emphasis words like: "진짜", "완전", "넘", "정말" **but ensure it sounds natural and not forced.**
    *   Naturally insert Korean interjections like: "하...", "어우..." **when contextually appropriate.**
    *   For surprise/emphasis: Use multiple exclamation marks, like "!!!!!" **but avoid overdoing it in every situation of surprise.**
    *   For questions/doubt: Use multiple question marks, like "?????" **when genuinely expressing strong doubt or a rhetorical question.**
4. Sentence Additions (Korean conversational habits): For additional explanations: Use parentheses "()". When hesitant or seeking agreement: Use phrases like "그쵸?", "맞나요?". Insert line breaks frequently for natural breath/pacing. Frequently use colloquial Korean adverbs like: "막", "좀", "그냥".
5. Speech Characteristics (Korean preferences): Prefer vague Korean expressions for numbers/amounts: "쯤", "정도". Use everyday Korean words, not jargon or difficult terms. Frequently use uncertain Korean expressions like: "~처럼요", "~같아요".
**"Important (Korean Output Context):** While using this specific Korean speaking style, maintain the accuracy and truthfulness of the information provided. However, when serious advice or information needs to be conveyed, reduce excessive emoticons or overly colloquial Korean. All responses should be friendly and comfortable, maintaining a warm and considerate tone towards others. **Remember, the entire output must be in Korean, reflecting this described persona and style.**"`
        });
      }
    } catch (e: any) {
      console.error("로컬 스토리지 로드 오류:", e);
      setError("커뮤니티 데이터 로드 중 오류가 발생했습니다.");
      setCommunities({});
    }
  }, []);

  useEffect(() => {
    if (Object.keys(communities).length > 0 || localStorage.getItem(COMMUNITIES_LOCAL_STORAGE_KEY) !== null) {
        localStorage.setItem(COMMUNITIES_LOCAL_STORAGE_KEY, JSON.stringify(communities));
    }
  }, [communities]);

  useEffect(() => {
    const communityKeys = Object.keys(communities).sort();
    if (communityKeys.length > 0) {
      const firstKey = communityKeys[0];
      if (!selectedCommunityForPost) setSelectedCommunityForPost(firstKey);
      if (!selectedCommunityForComment) setSelectedCommunityForComment(firstKey);
      if (!selectedCommunityForToneChange) setSelectedCommunityForToneChange(firstKey);
      if (!selectedCommunityForAuto) setSelectedCommunityForAuto(firstKey);
    } else {
      setSelectedCommunityForPost('');
      setSelectedCommunityForComment('');
      setSelectedCommunityForToneChange('');
      setSelectedCommunityForAuto('');
    }
  }, [communities, selectedCommunityForAuto, selectedCommunityForComment, selectedCommunityForPost, selectedCommunityForToneChange]); 

  const handleSaveCommunity = useCallback(() => {
    if (!editingCommunityName.trim() || !editingCommunityPrompt.trim()) {
      setError('커뮤니티 이름과 프롬프트를 모두 입력해주세요.'); return;
    }
    setCommunities(prev => {
        const newCommunities = { ...prev };
        if (selectedCommunityForEdit && selectedCommunityForEdit !== editingCommunityName.trim() && newCommunities[selectedCommunityForEdit]) {
            delete newCommunities[selectedCommunityForEdit];
        }
        newCommunities[editingCommunityName.trim()] = editingCommunityPrompt.trim();
        return newCommunities;
    });
    setEditingCommunityName(''); setEditingCommunityPrompt(''); setSelectedCommunityForEdit(''); setError('');
  }, [editingCommunityName, editingCommunityPrompt, selectedCommunityForEdit]);

  const handleDeleteCommunity = useCallback((communityName: string) => {
    if (window.confirm(`정말로 '${communityName}' 커뮤니티를 삭제하시겠습니까?`)) {
      setCommunities(prev => {
        const newComm = { ...prev }; delete newComm[communityName]; return newComm;
      });
      if (selectedCommunityForEdit === communityName) {
        setSelectedCommunityForEdit(''); setEditingCommunityName(''); setEditingCommunityPrompt('');
      }
    }
  }, [selectedCommunityForEdit]);

  const handleSelectCommunityForEdit = useCallback((name: string) => {
    setSelectedCommunityForEdit(name);
    if (name && communities[name]) {
      setEditingCommunityName(name); setEditingCommunityPrompt(communities[name]);
    } else {
      setEditingCommunityName(''); setEditingCommunityPrompt('');
    }
  }, [communities]);

  const callGeminiApiInternal = useCallback(async (
    prompt: string, 
    temperature: number, 
    useGoogleSearch: boolean = false, 
    responseMimeType?: "application/json" | "text/plain" 
  ): Promise<GenerateContentResponse | string | null> => { 
    if (!aiInstance) {
      setError('Gemini SDK가 초기화되지 않았습니다. API 키 설정을 확인하세요.');
      return null;
    }
    
    const modelAPIConfig: any = { temperature };

    try {
      if (useGoogleSearch) {
        modelAPIConfig.tools = [{googleSearch: {}}];
        if (responseMimeType === "text/plain") {
            modelAPIConfig.responseMimeType = "text/plain";
        }
        
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: modelAPIConfig 
        });
        return response; 

      } else if (responseMimeType === "application/json") {
        modelAPIConfig.responseMimeType = "application/json";
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: modelAPIConfig
        });
        return response; 

      } else {
        if (responseMimeType === "text/plain") {
            modelAPIConfig.responseMimeType = "text/plain"; 
        }
        let responseText: string = '';
        const streamResult = await aiInstance.models.generateContentStream({
          model: 'gemini-2.5-flash-preview-04-17',
          contents: prompt,
          config: modelAPIConfig 
        });
        for await (const chunk of streamResult) {
          responseText += chunk.text ?? '';
        }
        return responseText; 
      }
    } catch (e: any) {
        console.error(`Gemini API 호출 오류 (프롬프트 길이: ${prompt.length}, GoogleSearch: ${useGoogleSearch}, MimeType: ${responseMimeType}):`, e);
        setError(`API 호출 오류: ${e.message || '알 수 없는 오류'}`);
        return null;
    }
  }, [aiInstance]); 

  const extractSection = (source: string | null, startDelim: string, endDelim: string): string | null => {
    if (!source) return null;
    const startIndex = source.indexOf(startDelim);
    const endIndex = source.indexOf(endDelim, startIndex + startDelim.length);
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        return source.substring(startIndex + startDelim.length, endIndex).trim();
    }
    console.warn(`구분자 파싱 실패: ${startDelim} 또는 ${endDelim}을(를) 찾을 수 없습니다.`);
    return null;
  };

  const parseTitleAndBody = (sectionContent: string | null): PostOutput => {
    if (!sectionContent) return { title: "[파싱 오류]", body: "입력된 섹션 내용이 없습니다." };
    const titleDelimiterStart = "[제목]";
    const contentDelimiterStart = "[내용]";
    let title = "[제목을 찾을 수 없습니다]";
    let body = sectionContent;

    const titleStartIndex = sectionContent.indexOf(titleDelimiterStart);
    const contentStartIndex = sectionContent.indexOf(contentDelimiterStart);

    if (titleStartIndex !== -1) {
        if (contentStartIndex !== -1 && contentStartIndex > titleStartIndex) {
            title = sectionContent.substring(titleStartIndex + titleDelimiterStart.length, contentStartIndex).trim();
            body = sectionContent.substring(contentStartIndex + contentDelimiterStart.length).trim();
        } else {
            title = sectionContent.substring(titleStartIndex + titleDelimiterStart.length).trim();
            body = "[본문을 찾을 수 없습니다 (내용 구분자 누락 또는 순서 오류)]";
        }
    } else if (contentStartIndex !== -1) {
        body = sectionContent.substring(contentStartIndex + contentDelimiterStart.length).trim();
        title = "[제목을 찾을 수 없습니다 (제목 구분자 누락)]";
    } else {
         body = sectionContent; 
    }
    
    title = title.trim() === "" ? "[제목이 비어있습니다]" : title;
    body = body.trim() === "" ? "[본문 내용이 비어있습니다]" : body;

    return { title, body };
  };
  
  const getSentimentInstructionText = (
    type: PostType,
    newsSentiment?: NewsSummarySentimentType, // For newsReaction
    reviewSubj?: string, // For review
    reviewAppeal?: string, // For review
    posIntensity?: number, // For review
    negIntensity?: number // For review
  ): string => {
    if (type === 'review' && typeof posIntensity === 'number' && typeof negIntensity === 'number') {
        const reviewSubjectText = reviewSubj ? `"${reviewSubj}"에 대한` : "주어진 주제에 대한";
        const appealPointText = reviewAppeal ? ` 특히 "${reviewAppeal}"점을 고려하여,` : "";
        let instruction = `당신의 주요 목표는 ${reviewSubjectText} 후기 작성을 위한 **사실 기반 요약 초안을 작성**하는 것입니다. ${appealPointText}긍정적 강도 ${posIntensity}/5, 부정적 강도 ${negIntensity}/5 입니다. 다음을 의미합니다:\n`;

        if (posIntensity > 0 && negIntensity === 0) {
            instruction += `- "후기 대상"의 긍정적인 특징, 사양, 공개적으로 알려진 장점, 또는 제공된 "소구 포인트/정보" 중 긍정적 요소에 초점을 맞춰 사실을 선택하고 제시하세요.\n`;
        } else if (negIntensity > 0 && posIntensity === 0) {
            instruction += `- "후기 대상"의 부정적인 특징, 알려진 문제점, 한계점, 또는 제공된 "소구 포인트/정보" 중 부정적 요소에 초점을 맞춰 사실을 선택하고 제시하세요.\n`;
        } else if (posIntensity > 0 && negIntensity > 0) {
            instruction += `- "후기 대상"에 대해 긍정적 및 부정적 측면 모두를 다룰 수 있는 다양한 사실들을 선택하세요. (예: 장점, 단점, 호불호 갈리는 지점 등). 이 정보는 추후 긍정적 강도(${posIntensity})와 부정적 강도(${negIntensity})에 맞춰 복합적인 후기를 작성하는 데 사용됩니다.\n`;
        } else { // Both are 0
            instruction += `- "후기 대상"의 주요 특징, 사양, 또는 제공된 "소구 포인트/정보"를 어떠한 특정 감정적 편견 없이 객관적으로 나열하세요.\n`;
        }
        instruction += `이 초기 초안(한국어로 1-3문장, 이 초안 단계에서는 중립적인 *문체* 유지)은 해당 주제에 대한 사실적 정보를 전달해야 합니다. **이것은 아직 의견이나 경험에 대한 글이 아니라, 후일의 리뷰 작성을 위한 사실 기반 요약문입니다.**`;
        return instruction;

    } else if (type === 'newsReaction' && newsSentiment) {
      switch (newsSentiment) {
        case "positive":
          return "당신의 주요 목표는 *뉴스를 낙관적으로 해석*하고 그것에 대한 *초기 긍정적인 개인 반응을 공식화*하는 것입니다. 다음을 의미합니다: \n" +
                 "- 기사에 언급된 긍정적인 측면, 이점, 잠재적 성공 또는 희망적인 요소에 분석의 초점을 맞추십시오.\n" +
                 "- 뉴스에 복합적인 측면이 있는 경우, 긍정적인 각도를 강조하도록 해석과 후속 반응을 선택하고 구성하십시오.\n" +
                 "- 당신의 초기 반응(한국어로 1-3문장, 이 초안에는 중립적인 어조 유지)은 기사에 사실적으로 근거해야 하지만 그 기본 해석은 명확히 긍정적이어야 합니다. 뒷받침되지 않는 의견 추가는 피하되, 긍정적인 렌즈가 이 초안 단계의 해석과 초기 사고 과정을 안내하도록 하십시오.";
        case "negative":
          return "당신의 주요 목표는 *뉴스를 비관적으로 해석*하고 그것에 대한 *초기 비판적이거나 우려스러운 개인 반응을 공식화*하는 것입니다. 다음을 의미합니다: \n" +
                 "- 기사에 언급된 부정적인 측면, 단점, 잠재적 실패, 위험 또는 우려스러운 요소에 분석의 초점을 맞추십시오.\n" +
                 "- 뉴스에 복합적인 측면이 있는 경우, 부정적인 각도를 강조하도록 해석과 후속 반응을 선택하고 구성하십시오.\n" +
                 "- 당신의 초기 반응(한국어로 1-3문장, 이 초안에는 중립적인 어조 유지)은 기사에 사실적으로 근거해야 하지만 그 기본 해석은 명확히 부정적/비판적이어야 합니다. 뒷받침되지 않는 의견 추가는 피하되, 부정적인 렌즈가 이 초안 단계의 해석과 초기 사고 과정을 안내하도록 하십시오.";
        case "neutral":
        default:
          return "당신의 주요 목표는 *뉴스를 극도의 객관성으로 해석*하고 *초기의 엄격하게 중립적인 개인 반응을 공식화*하는 것입니다. " +
                 "- 당신의 분석은 제공된 뉴스 기사 내의 **비중립적인 표현이나 함의를 식별하고 적극적으로 중화**해야 합니다. 예를 들어, 뉴스가 '시민 편의와 안전을 위한 조치입니다'라고 명시하는 경우, 그것이 내재된 편견을 담고 있는 것으로 보인다면 당신의 해석은 이 정당화를 단순히 반복해서는 안 됩니다. 대신, 핵심적인 사실적 사건(예: '유지보수가 발생할 것입니다')에 초점을 맞추십시오.\n" +
                 "- 당신의 초기 반응(한국어로 1-3문장, 이 초안에는 순수하게 묘사적이고 중립적인 ~이다/~한다 스타일 또는 간단한 사실적 관찰 유지)은 해석과 표현에서 어떠한 긍정적 또는 부정적 성향도 없어야 합니다.\n" +
                 "- 목표는 이 초안 단계에서 진정한 중립성을 달성하기 위해 원본 뉴스의 일부를 바꾸어 표현하더라도 *냉정한 사실적 요약으로 이어지는 편견 없는 초기 생각*입니다.";
      }
    }
    return "지침을 생성할 수 없습니다. 입력값을 확인해주세요."; // Fallback
  };

  const getAutomatedPostStep1Guidance = (): string => {
    return "Your primary goal is to *interpret the news objectively* but to *formulate an initial, common-sense human reaction* to it, presented in a standard polite Korean tone (e.g., ~습니다, ~합니다, or neutral ~요 style) for this draft stage. This means:\n" +
           "- Analyze the provided 'News Article' for its key facts and core message.\n" +
           "- Based on this, draft a short (1-3 sentences) personal thought or reaction that a typical person might have upon encountering this news. This reaction should be grounded in the news facts but represent a common-sense, relatable initial response.\n" +
           "- While the language of this draft must remain neutral in TONE (avoiding strong emotional words or overtly biased phrasing), the *content* of the reaction can reflect a natural, mild leaning if the news inherently suggests it (e.g., slight surprise at an unusual event, acknowledgement of a common concern, or noting something generally interesting). The goal is a sensible first thought, not an artificially flat or dispassionate summary if that feels unnatural for the news.\n" +
           "- The persona from the 'Community-Specific Prompt' should only be used at this stage to understand *what kind of general topic or concern* might arise from the news (e.g., safety, cost, surprise), NOT to imprint specific demographic traits or voice into this draft. The reaction should still be grounded in the news content and presented in standard polite/neutral Korean.";
  };


  const generateCommunityPostInternal = useCallback(async (newsContent: string, communityPrompt: string): Promise<PostOutput | { error: string }> => {
    if (!aiInstance) return { error: 'Gemini SDK가 초기화되지 않았습니다.' };
    if (!newsContent.trim()) return { error: '뉴스 내용이 비어있습니다.' };
    if (!communityPrompt.trim()) return { error: '커뮤니티 프롬프트가 비어있습니다.' };

    const tempStep1 = 0.5;
    const tempStep2 = 0.65; 

    try {
        const step1GuidanceForAutoPost = getAutomatedPostStep1Guidance();
        const promptStep1 = `
[[CONTEXT BEGIN]]
${FIXED_SYSTEM_PROMPT}

<Community-Specific Prompt START>
${communityPrompt}
<Community-Specific Prompt END>

<News Article START>
${newsContent}
<News Article END>
[[CONTEXT END]]

Instruction: Execute ONLY [[TASK DEFINITION FOR DRAFTING NEUTRAL POST BASED ON NEWS OR REVIEW (STEP 1 - COMBINED)]] from the FIXED_SYSTEM_PROMPT based on the provided CONTEXT.
This is for an AUTOMATED NEWS POSTING. The "News Article" is actual news.
For this specific execution of Step 1 (Automated Posting), your news interpretation and reaction framing MUST be guided by the following:
**Guidance for Step 1 Draft (Automated Posting):** ${step1GuidanceForAutoPost}
Ensure your "Neutral Post Draft Based on News" reflects this guidance. It should be a common-sense human reaction presented in a neutral Korean tone.
Provide the "Neutral Post Draft Based on News" delimited with "[[NEUTRAL POST DRAFT BEGIN]]" and "[[NEUTRAL POST DRAFT END]]".
Do not perform any other steps.`;

        const step1ResultText = await callGeminiApiInternal(promptStep1, tempStep1) as string;
        if (typeof step1ResultText !== 'string') throw new Error("1단계: API로부터 예상치 못한 응답 형식(문자열이 아님)을 받았습니다.");
        
        const extractedNeutralPostDraft = extractSection(step1ResultText, "[[NEUTRAL POST DRAFT BEGIN]]", "[[NEUTRAL POST DRAFT END]]");
        if (!extractedNeutralPostDraft) {
            console.error("1단계 파싱 실패 (자동 포스팅). Raw 응답:", step1ResultText);
            throw new Error("1단계 (자동 포스팅): '뉴스 기반 중립 초안' 결과 파싱에 실패했습니다.");
        }

        const promptStep2 = `
[[CONTEXT BEGIN]]
${FIXED_SYSTEM_PROMPT}

<Community-Specific Prompt START>
${communityPrompt}
<Community-Specific Prompt END>

<Neutral Post Draft Based on News (from Step 1) START>
${extractedNeutralPostDraft}
<Neutral Post Draft Based on News (from Step 1) END>
[[CONTEXT END]]

Instruction: Execute ONLY [[TASK DEFINITION FOR COMMUNITY TONE TRANSFORMATION (STEP 2 - FINAL POST)]] from the FIXED_SYSTEM_PROMPT based on the provided CONTEXT.
The "Neutral Post Draft Based on News" (from Step 1) was generated to capture a **common-sense human reaction to news in a neutral tone**, specifically for automated news posting.
Your final transformed post (Version 1) MUST take this draft and fully adapt it to the community's style, ensuring the final output feels like an authentic post from a community member expressing that common-sense reaction.
Generate ONLY Version 1. Delimit it with "[[FINAL POST VERSION 1 BEGIN]]" and "[[FINAL POST VERSION 1 END]]".
Do not generate Version 2.`;

        const step2ResultText = await callGeminiApiInternal(promptStep2, tempStep2) as string; 
        if (typeof step2ResultText !== 'string') throw new Error("2단계: API로부터 예상치 못한 응답 형식(문자열이 아님)을 받았습니다.");

        const finalPostText = extractSection(step2ResultText, "[[FINAL POST VERSION 1 BEGIN]]", "[[FINAL POST VERSION 1 END]]");
        if (!finalPostText) {
            console.error("2단계 파싱 실패 (자동 포스팅). Raw 응답:", step2ResultText);
            throw new Error("2단계 (자동 포스팅): '커뮤니티 스타일 글(V1)' 결과 파싱에 실패했습니다.");
        }
        
        return parseTitleAndBody(finalPostText);

    } catch (e: any) {
        console.error("자동 글 생성 중 오류:", e);
        return { error: e.message || "자동 글 생성 중 알 수 없는 오류 발생" };
    }
  }, [aiInstance, callGeminiApiInternal]);


  const handleGeneratePostsFromNews = useCallback(async () => {
    const isReview = postType === 'review';
    const mainInput = isReview ? reviewSubject : newsInputForPost;

    if (!mainInput.trim()) { 
      setError(isReview ? '후기 대상을 입력해주세요.' : '뉴스 내용을 입력해주세요.'); 
      return; 
    }
    if (!selectedCommunityForPost || !communities[selectedCommunityForPost]) { setError('대상 커뮤니티를 선택해주세요.'); return; }
    if (!aiInstance) { setError('Gemini SDK가 초기화되지 않았습니다.'); return; }

    setIsManuallyGeneratingPost(true);
    setError('');
    setManualPostGenerationStep(isReview ? "1/2: 후기 대상 정보 요약 중..." : "1/2: 뉴스 분석 및 초안 작성 중...");
    setNeutralPostStep2('');
    setGeneratedPostVersion1({ title: '', body: '' });
    setGeneratedPostVersion2({ title: '', body: '' });

    const communityGuideline = communities[selectedCommunityForPost];
    const tempStep1Combined = 0.5;
    const tempStep2V1 = 0.65;
    const tempStep2V2 = 0.75;

    try {
      let inputContentBlock = '';
      let step1SentimentInstructionText = '';
      let sentimentGuidanceLabel = '';

      if (isReview) {
        inputContentBlock = `<Review Subject START>\n${reviewSubject}\n<Review Subject END>\n\n`;
        inputContentBlock += `<Review Appeal Points/Information START>\n${reviewAppealPoint || "특별히 명시된 소구 포인트/정보 없음"}\n<Review Appeal Points/Information END>\n\n`;
        inputContentBlock += `<Review Positive Intensity START>\n${reviewPositiveIntensity}\n<Review Positive Intensity END>\n\n`;
        inputContentBlock += `<Review Negative Intensity START>\n${reviewNegativeIntensity}\n<Review Negative Intensity END>`;
        sentimentGuidanceLabel = 'Sentiment Guidance for Review Factual Summary (Positive/Negative Intensities & Appeal Points)';
        step1SentimentInstructionText = getSentimentInstructionText(postType, undefined, reviewSubject, reviewAppealPoint, reviewPositiveIntensity, reviewNegativeIntensity);

      } else { // newsReaction
        inputContentBlock = `<News Article START>\n${newsInputForPost}\n<News Article END>`;
        sentimentGuidanceLabel = 'Sentiment Guidance for News Interpretation';
        step1SentimentInstructionText = getSentimentInstructionText(postType, newsSummarySentiment);
      }
      
      const step1TaskInstruction = isReview ?
        `Instruction: Execute ONLY [[TASK DEFINITION FOR DRAFTING NEUTRAL POST BASED ON NEWS OR REVIEW (STEP 1 - COMBINED)]] from the FIXED_SYSTEM_PROMPT. Your task is to draft an initial **FACTUAL SUMMARY** of the "Review Subject", "Review Appeal Points/Information", using the provided "Positive Intensity" and "Negative Intensity". The "News Article" mentioned in the task definition should be understood as these review-related inputs for this specific task. The output must be a factual summary, not an opinion or experience.` :
        `Instruction: Execute ONLY [[TASK DEFINITION FOR DRAFTING NEUTRAL POST BASED ON NEWS OR REVIEW (STEP 1 - COMBINED)]] from the FIXED_SYSTEM_PROMPT. Your task is to draft an initial **REACTION TO THE NEWS** based on the "News Article".`;
      
      const promptStep1Combined = `
[[CONTEXT BEGIN]]
${FIXED_SYSTEM_PROMPT}

<Community-Specific Prompt START>
${communityGuideline}
<Community-Specific Prompt END>

${inputContentBlock}
[[CONTEXT END]]

${step1TaskInstruction}
For this specific execution of Step 1, your factual selection (for reviews based on intensities) or interpretation and reaction framing (for news based on sentiment) MUST be guided by the following:
**${sentimentGuidanceLabel}:** ${step1SentimentInstructionText}
Ensure your "Neutral Post Draft Based on News" (which will be a neutral draft of a ${isReview ? 'factual summary of the review subject' : 'news reaction'}) clearly reflects this chosen guidance and input type in its underlying factual selection/interpretation and subsequent neutral-toned draft.
Provide the "Neutral Post Draft Based on News" delimited with "[[NEUTRAL POST DRAFT BEGIN]]" and "[[NEUTRAL POST DRAFT END]]".
Do not perform any other steps.`;

      const step1CombinedResult = await callGeminiApiInternal(promptStep1Combined, tempStep1Combined); 
      if (typeof step1CombinedResult !== 'string') {
        throw new Error("1단계: API로부터 예상치 못한 응답 형식(문자열 아님)을 받았습니다.");
      }
      const extractedNeutralPostDraft = extractSection(step1CombinedResult, "[[NEUTRAL POST DRAFT BEGIN]]", "[[NEUTRAL POST DRAFT END]]");

      if (!extractedNeutralPostDraft) {
        console.error("1단계 파싱 실패. Raw 응답:", step1CombinedResult);
        throw new Error("1단계: '초안' 결과 파싱에 실패했습니다. API 응답 형식을 확인하세요.");
      }
      setNeutralPostStep2(extractedNeutralPostDraft);

      const step2StatusMessage = isReview ? "2/2: 커뮤니티 스타일 후기 (의견/경험) 생성 중 (V1)..." : "2/2: 커뮤니티 스타일 적용 중 (V1)...";
      setManualPostGenerationStep(step2StatusMessage);

      let step2SentimentContext = '';
      let step2TransformationGoal = '';

      if (isReview) {
        step2SentimentContext = `The "Neutral Post Draft Based on News" (from Step 1) was generated as a FACTUAL SUMMARY of "${reviewSubject}" (and potentially focusing on aspects from "Review Appeal Points/Information"). It should be used as the factual basis for a review. The target sentiment expression for the final review is: Positive Intensity ${reviewPositiveIntensity}/5, Negative Intensity ${reviewNegativeIntensity}/5.`;
        step2TransformationGoal = `Your final transformed post (Version 1) MUST be a clear REVIEW. Based on the factual draft from Step 1, express simulated personal experiences, opinions, or feelings that reflect a Positive Intensity of ${reviewPositiveIntensity}/5 and a Negative Intensity of ${reviewNegativeIntensity}/5. If both intensities are above 0, create a review that naturally integrates both positive and negative points. If only one intensity is dominant, focus on that. If both are 0, provide an objective observation or description in community style. This post MUST be fully adapted to the community style.`;
      } else { // newsReaction
        step2SentimentContext = `The "Neutral Post Draft Based on News" was generated as an initial NEWS REACTION with a **${newsSummarySentiment.toUpperCase()}** underlying interpretation of the news.`;
        step2TransformationGoal = `Your final transformed post (Version 1) MUST reflect this **${newsSummarySentiment.toUpperCase()} NEWS REACTION sentiment**, fully adapted to the community style.`;
      }
      
      const promptStep2V1 = `
[[CONTEXT BEGIN]]
${FIXED_SYSTEM_PROMPT}

<Community-Specific Prompt START>
${communityGuideline}
<Community-Specific Prompt END>

<Neutral Post Draft Based on News (from Step 1) START>
${extractedNeutralPostDraft}
<Neutral Post Draft Based on News (from Step 1) END>
[[CONTEXT END]]

Instruction: Execute ONLY [[TASK DEFINITION FOR COMMUNITY TONE TRANSFORMATION (STEP 2 - FINAL POST)]] from the FIXED_SYSTEM_PROMPT based on the provided CONTEXT.
${step2SentimentContext}
${step2TransformationGoal}
Generate ONLY Version 1. Delimit it with "[[FINAL POST VERSION 1 BEGIN]]" and "[[FINAL POST VERSION 1 END]]".
Do not generate Version 2.`;
      
      const step2V1Result = await callGeminiApiInternal(promptStep2V1, tempStep2V1); 
      if (typeof step2V1Result !== 'string') {
        throw new Error("2단계 (V1): API로부터 예상치 못한 응답 형식(문자열 아님)을 받았습니다.");
      }
      const finalPostV1Text = extractSection(step2V1Result, "[[FINAL POST VERSION 1 BEGIN]]", "[[FINAL POST VERSION 1 END]]");
      if (!finalPostV1Text) {
        console.error("2단계 (V1) 파싱 실패. Raw 응답:", step2V1Result);
        throw new Error("2단계 (V1): '커뮤니티 스타일 글(V1)' 결과 파싱에 실패했습니다.");
      }
      setGeneratedPostVersion1(parseTitleAndBody(finalPostV1Text));

      const step2V2StatusMessage = isReview ? "2/2: 커뮤니티 스타일 후기 (의견/경험) 생성 중 (V2)..." : "2/2: 커뮤니티 스타일 적용 중 (V2)...";
      setManualPostGenerationStep(step2V2StatusMessage);
      
      let step2V2TransformationGoal = '';
      if (isReview) {
          step2V2TransformationGoal = `Your final transformed post (Version 2) MUST be a clear REVIEW. Based on the factual draft from Step 1, express simulated personal experiences, opinions, or feelings that reflect a Positive Intensity of ${reviewPositiveIntensity}/5 and a Negative Intensity of ${reviewNegativeIntensity}/5. If both intensities are above 0, create a review that naturally integrates both positive and negative points. If only one intensity is dominant, focus on that. If both are 0, provide an objective observation or description in community style. This post MUST be fully adapted to the community style. Make it distinct from Version 1.`;
      } else { // newsReaction
          step2V2TransformationGoal = `Your final transformed post (Version 2) MUST reflect this **${newsSummarySentiment.toUpperCase()} NEWS REACTION sentiment**, fully adapted to the community style. Make it distinct from Version 1.`;
      }


      const promptStep2V2 = `
[[CONTEXT BEGIN]]
${FIXED_SYSTEM_PROMPT}

<Community-Specific Prompt START>
${communityGuideline}
<Community-Specific Prompt END>

<Neutral Post Draft Based on News (from Step 1) START>
${extractedNeutralPostDraft}
<Neutral Post Draft Based on News (from Step 1) END>
[[CONTEXT END]]

Instruction: Execute ONLY [[TASK DEFINITION FOR COMMUNITY TONE TRANSFORMATION (STEP 2 - FINAL POST)]] from the FIXED_SYSTEM_PROMPT based on the provided CONTEXT.
${step2SentimentContext} 
${step2V2TransformationGoal}
Generate ONLY Version 2. Delimit it with "[[FINAL POST VERSION 2 BEGIN]]" and "[[FINAL POST VERSION 2 END]]".
Do not generate Version 1.`;

      const step2V2Result = await callGeminiApiInternal(promptStep2V2, tempStep2V2); 
      if (typeof step2V2Result !== 'string') {
        throw new Error("2단계 (V2): API로부터 예상치 못한 응답 형식(문자열 아님)을 받았습니다.");
      }
      const finalPostV2Text = extractSection(step2V2Result, "[[FINAL POST VERSION 2 BEGIN]]", "[[FINAL POST VERSION 2 END]]");
      if (!finalPostV2Text) {
        console.error("2단계 (V2) 파싱 실패. Raw 응답:", step2V2Result);
        throw new Error("2단계 (V2): '커뮤니티 스타일 글(V2)' 결과 파싱에 실패했습니다.");
      }
      setGeneratedPostVersion2(parseTitleAndBody(finalPostV2Text));
      setManualPostGenerationStep("게시글 생성 완료!");
    } catch (e: any) {
      console.error("게시글 생성 중 오류:", e);
      setError(`게시글 생성 오류: ${e.message}`);
      setManualPostGenerationStep("오류 발생. 콘솔을 확인하세요.");
    } finally {
      setIsManuallyGeneratingPost(false);
    }
  }, [newsInputForPost, reviewSubject, reviewAppealPoint, postType, selectedCommunityForPost, communities, aiInstance, newsSummarySentiment, reviewPositiveIntensity, reviewNegativeIntensity, callGeminiApiInternal]);

  const handleGenerateComments = useCallback(async () => {
    if (!originalPostForComment.trim()) { setError('원본 게시글 내용을 입력해주세요.'); return; }
    if (!selectedCommunityForComment || !communities[selectedCommunityForComment]) { setError('대상 커뮤니티를 선택해주세요.'); return; }
    if (!aiInstance) { setError('Gemini SDK가 초기화되지 않았습니다.'); return; }

    setIsGeneratingComments(true); setError(''); setGeneratedComments([]);
    const communityGuideline = communities[selectedCommunityForComment];
    const prompt = `당신은 "${selectedCommunityForComment}" 커뮤니티의 스타일을 완벽하게 이해하고 구사하는 AI입니다.
다음은 당신이 따라야 할 커뮤니티 스타일 가이드라인입니다:
<Community-Specific Prompt START>
${communityGuideline}
<Community-Specific Prompt END>

다음은 원본 게시글 내용입니다:
<Original Post START>
${originalPostForComment}
<Original Post END>

이 원본 게시글에 대해, 위에 명시된 커뮤니티 스타일을 철저히 준수하여 5개의 서로 다른 댓글을 작성해주세요.
각 댓글은 1줄에서 3줄 사이의 길이로 무작위로 작성해주세요.
각 댓글은 매우 자연스럽고 현실적인 반응이어야 하며, 마치 실제 해당 커뮤니티 사용자가 작성한 것처럼 보여야 합니다.
각 댓글은 서로 다른 관점이나 반응을 보여주도록 노력해주세요. (예: 공감, 질문, 추가 정보, 유머 등)
5개의 댓글을 각각 \`[[COMMENT]]\` 구분자로 분리하여 응답해주세요. 예: [[COMMENT]] 댓글1 내용 [[COMMENT]] 댓글2 내용 ...
절대 시스템 프롬프트에서 사용된 구분자([[TASK DEFINITION...]])나 게시글 생성시 사용된 구분자([[FINAL POST...]])를 사용하지 마세요.
오직 \`[[COMMENT]]\` 만을 구분자로 사용하세요.`;

    try {
      const resultText = await callGeminiApiInternal(prompt, 0.7) as string; 
      if (typeof resultText !== 'string') {
        throw new Error("API로부터 예상치 못한 응답 형식(문자열 아님)을 받았습니다.");
      }
      const commentsArray = resultText.split('[[COMMENT]]').map(c => c.trim()).filter(c => c.length > 0);
      setGeneratedComments(commentsArray.slice(0, 5));
      if (commentsArray.length === 0) setError("생성된 댓글이 없습니다. 응답 형식을 확인해주세요.");
    } catch (e: any) {
      console.error("댓글 생성 중 오류:", e);
      setError(`댓글 생성 오류: ${e.message}`);
    } finally {
      setIsGeneratingComments(false);
    }
  }, [originalPostForComment, selectedCommunityForComment, communities, aiInstance, callGeminiApiInternal]);

  const handleToneChange = useCallback(async () => {
    if (!textForToneChange.trim()) { setError('톤 변경할 원본 텍스트를 입력해주세요.'); return; }
    if (!selectedCommunityForToneChange || !communities[selectedCommunityForToneChange]) { setError('대상 커뮤니티를 선택해주세요.'); return; }
    if (!aiInstance) { setError('Gemini SDK가 초기화되지 않았습니다.'); return; }

    setIsChangingTone(true); setError(''); setToneChangedText('');
    const communityGuideline = communities[selectedCommunityForToneChange];
    const prompt = `당신은 "${selectedCommunityForToneChange}" 커뮤니티의 스타일을 완벽하게 이해하고 구사하는 AI입니다.
다음은 당신이 따라야 할 커뮤니티 스타일 가이드라인입니다:
<Community-Specific Prompt START>
${communityGuideline}
<Community-Specific Prompt END>

다음은 사용자가 제공한 원본 텍스트입니다:
<Original Text START>
${textForToneChange}
<Original Text END>

이 원본 텍스트의 핵심 의미와 내용을 유지하면서, 위에 명시된 커뮤니티 스타일 가이드라인에 따라 텍스트 전체를 해당 커뮤니티의 말투와 스타일로 변경해주세요.
최대한 자연스럽고, 마치 실제 해당 커뮤니티 사용자가 작성한 것처럼 보이도록 변환해야 합니다.
변환된 텍스트만을 응답으로 제공해주세요. 다른 추가 설명이나 구분자는 필요 없습니다.`;

    try {
      const resultText = await callGeminiApiInternal(prompt, 0.6) as string; 
      if (typeof resultText !== 'string') {
        throw new Error("API로부터 예상치 못한 응답 형식(문자열 아님)을 받았습니다.");
      }
      setToneChangedText(resultText.trim());
    } catch (e: any) {
      console.error("톤 변경 중 오류:", e);
      setError(`톤 변경 오류: ${e.message}`);
    } finally {
      setIsChangingTone(false);
    }
  }, [textForToneChange, selectedCommunityForToneChange, communities, aiInstance, callGeminiApiInternal]);


  const handleFetchKeywordNewsDigest = useCallback(async () => {
    if (!googleSearchQuery.trim()) {
      setKeywordNewsFetchError('검색어를 입력해주세요.'); return;
    }
    if (!aiInstance) {
      setKeywordNewsFetchError('Gemini SDK가 초기화되지 않았습니다.'); return;
    }
    setIsFetchingKeywordNews(true);
    setKeywordNewsFetchError('');
    setKeywordNewsDigest('');
    setKeywordNewsSources([]);
    setGeneratedKeywordPost(null);
    setKeywordNewsFetchStatus("뉴스 요약 및 출처 검색 중 (Google Search 사용)...");

    const prompt = `"${googleSearchQuery}" 주제와 관련된 최신 뉴스를 찾아 종합적인 요약문을 한국어로 생성해주세요. 요약 시, 해당 주제 내에서도 과도하게 정치적이거나 특정 정당/세력에 편향된 내용은 가능한 제외하거나, 사실 전달 위주로 매우 중립적으로 다루어 주세요. 요약문은 여러 뉴스의 핵심 정보를 종합하여 하나의 문단으로 구성해주세요. 추가 설명이나 개별 기사 목록은 필요 없습니다. 오직 종합된 요약문만 제공해주세요.`;

    try {
      const response = await callGeminiApiInternal(prompt, 0.5, true) as GenerateContentResponse; 
      if (!response || typeof response === 'string' || !response.text) { 
        throw new Error("API로부터 뉴스 요약 응답을 받지 못했거나 잘못된 형식입니다.");
      }
      setKeywordNewsDigest(response.text.trim());
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((chunk: GroundingChunk) => chunk.web?.uri) || [];
      setKeywordNewsSources(sources);
      setKeywordNewsFetchStatus(`'${googleSearchQuery}' 관련 뉴스 요약 완료. ${sources.length > 0 ? `${sources.length}개 출처 확인됨.` : '출처 정보 없음.'}`);
    } catch (e: any) {
      console.error("키워드 뉴스 요약 가져오기 오류:", e);
      setKeywordNewsFetchError(`키워드 뉴스 요약 실패: ${e.message}`);
      setKeywordNewsFetchStatus("오류 발생. 콘솔을 확인하세요.");
    } finally {
      setIsFetchingKeywordNews(false);
    }
  }, [googleSearchQuery, aiInstance, callGeminiApiInternal]);

  const normalizeTitleForDeduplication = (title: string): string => {
    if (!title) return "";
    return title.toLowerCase()
      .replace(/\s+/g, '') 
      .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, ''); 
  };
  
  const handleRecommendNewsCategories = useCallback(async () => {
    if (!selectedCommunityForAuto || !communities[selectedCommunityForAuto]) {
      setError('자동 글 생성을 위한 커뮤니티를 선택해주세요.'); return;
    }
    if (!aiInstance) {
      setError('Gemini SDK가 초기화되지 않았습니다.'); return;
    }

    setIsGeneratingTopNews(true);
    setTopNewsGenerationStep(`커뮤니티 '${communities[selectedCommunityForAuto] ? selectedCommunityForAuto : '알 수 없음'}' 맞춤 뉴스 카테고리 추천 중...`);
    setGeneratedTopNewsPosts([]);
    setRecommendedNewsCategories([]);
    setSelectedNewsCategoriesForAutoPost([]);
    setError('');

    const communityPrompt = communities[selectedCommunityForAuto];
    const NUM_AI_CATEGORIES_TO_FETCH = 7; // AI에게 요청할 카테고리 수
    const GUARANTEED_CATEGORY = "연예/가십";
    const MAX_RECOMMENDED_CATEGORIES = 8;


    try {
      const categoryGenPrompt = `
당신은 커뮤니티 분석 전문가입니다. 다음은 특정 온라인 커뮤니티의 스타일 및 사용자 특성입니다:
<Community-Specific Prompt START>
${communityPrompt}
<Community-Specific Prompt END>

위 커뮤니티의 사용자들이 가장 관심을 가질 만한 뉴스 카테고리 ${NUM_AI_CATEGORIES_TO_FETCH}개를 한국어로 추천해주세요.
각 카테고리는 간결한 명사형으로 제시하고, **정치 관련 카테고리는 반드시 제외**해주세요.
또한, "${GUARANTEED_CATEGORY}" 카테고리는 이미 포함될 예정이니, 이와 중복되지 않는 다른 카테고리들을 추천해주세요.
결과는 반드시 JSON 문자열 배열 형태로 응답해주세요. 예: ["IT/기술", "생활경제", "육아정보", "해외토픽", "건강/웰빙"]
다른 설명 없이 JSON 배열만 응답해야 합니다.`;

      const categoryResponse = await callGeminiApiInternal(categoryGenPrompt, 0.4, false, "application/json") as GenerateContentResponse;
      if (!categoryResponse || typeof categoryResponse === 'string' || !categoryResponse.text) {
          throw new Error("커뮤니티 맞춤 뉴스 카테고리 추천을 받지 못했거나 API 응답 형식이 잘못되었습니다.");
      }
      
      let categoriesJsonStr = categoryResponse.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      let match = categoriesJsonStr.match(fenceRegex);
      if (match && match[2]) {
        categoriesJsonStr = match[2].trim();
      }

      let fetchedCategoriesFromAI: string[];
      try {
        fetchedCategoriesFromAI = JSON.parse(categoriesJsonStr);
        if (!Array.isArray(fetchedCategoriesFromAI) || fetchedCategoriesFromAI.some(cat => typeof cat !== 'string')) {
          throw new Error("잘못된 카테고리 JSON 형식 또는 문자열이 아닌 요소 포함.");
        }
      } catch (parseError: any) {
        console.error("뉴스 카테고리 JSON 파싱 오류. Raw:", categoriesJsonStr, "Error:", parseError);
        throw new Error(`뉴스 카테고리 목록 JSON 파싱 실패: ${parseError.message}. Gemini 응답을 확인해주세요.`);
      }

      let combinedCategories = [GUARANTEED_CATEGORY];
      if (fetchedCategoriesFromAI.length > 0) {
          const uniqueAIFetched = fetchedCategoriesFromAI.filter(
              cat => cat.toLowerCase() !== GUARANTEED_CATEGORY.toLowerCase()
          );
          combinedCategories = [...combinedCategories, ...uniqueAIFetched];
      }
      
      // Ensure unique categories and limit to MAX_RECOMMENDED_CATEGORIES
      const finalRecommendedCategories = Array.from(new Set(combinedCategories)).slice(0, MAX_RECOMMENDED_CATEGORIES);


      if (finalRecommendedCategories.length === 0) {
        setTopNewsGenerationStep("추천된 뉴스 카테고리가 없습니다. (항상 포함되는 '연예/가십' 포함)");
        setRecommendedNewsCategories([GUARANTEED_CATEGORY]); // Ensure at least the guaranteed one is there
      } else {
        setRecommendedNewsCategories(finalRecommendedCategories); 
        setTopNewsGenerationStep(`카테고리 추천 완료 (${finalRecommendedCategories.length}개). 아래에서 포스팅할 카테고리를 선택해주세요.`);
      }
    } catch (e: any) {
      console.error("뉴스 카테고리 추천 중 오류:", e);
      setError(`뉴스 카테고리 추천 실패: ${e.message}`);
      setTopNewsGenerationStep(`카테고리 추천 오류: ${e.message}`);
      setRecommendedNewsCategories([GUARANTEED_CATEGORY]); // Fallback to guaranteed category on error
    } finally {
      setIsGeneratingTopNews(false);
    }
  }, [aiInstance, communities, selectedCommunityForAuto, callGeminiApiInternal]);

  const handleGeneratePostsFromSelectedCategories = useCallback(async () => {
    if (!selectedCommunityForAuto || !communities[selectedCommunityForAuto]) {
      setError('자동 글 생성을 위한 커뮤니티를 선택해주세요.'); return;
    }
    if (selectedNewsCategoriesForAutoPost.length === 0) {
      setError('포스팅할 뉴스 카테고리를 하나 이상 선택해주세요.'); return;
    }
    if (!aiInstance) {
      setError('Gemini SDK가 초기화되지 않았습니다.'); return;
    }

    setIsGeneratingTopNews(true);
    setGeneratedTopNewsPosts([]);
    setError('');
    setTopNewsGenerationStep(`선택된 카테고리(${selectedNewsCategoriesForAutoPost.length}개) 뉴스 수집 시작...`);
    
    const communityPrompt = communities[selectedCommunityForAuto];
    const NUM_NEWS_PER_CATEGORY = 3;
    const allFetchedNewsItems: ProcessedNewsItem[] = [];
    const uniqueNewsTitles = new Set<string>();

    try {
      for (const category of selectedNewsCategoriesForAutoPost) {
        setTopNewsGenerationStep(`카테고리 '${category}' 뉴스 수집 중 (최대 ${NUM_NEWS_PER_CATEGORY}개)...`);
        const newsFetchPrompt = `대한민국의 '${category}' 분야 최신 뉴스 기사 ${NUM_NEWS_PER_CATEGORY}개를 찾아주세요. 
        **정치 관련 뉴스는 반드시 제외해주세요.** 각 기사의 (1) 원본 제목 (string, 'title' 키), 
        (2) 원본 기사 URL (string, 'url' 키), (3) 해당 기사의 핵심 내용을 2-3문장으로 요약한 한국어 요약문 (string, 'summary' 키)을 
        포함하는 JSON 객체들의 배열 형태로 제공해주세요. 반드시 title, url, summary 키를 가져야 합니다.
        응답은 전체가 유효한 JSON 배열이어야 합니다. 다른 설명 없이 JSON 배열만 응답해야 합니다.`;

        const newsListResponse = await callGeminiApiInternal(newsFetchPrompt, 0.5, true, "application/json") as GenerateContentResponse;
        
        if (!newsListResponse || typeof newsListResponse === 'string' || !newsListResponse.text) {
          console.warn(`카테고리 '${category}'에 대한 뉴스 목록을 받지 못했거나 API 응답 형식이 잘못되었습니다. 응답:`, newsListResponse);
          setTopNewsGenerationStep(`카테고리 '${category}' 뉴스 수집 실패. 다음 카테고리로 넘어갑니다.`);
          continue; 
        }
        
        let newsItemsJsonStr = newsListResponse.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        let match = newsItemsJsonStr.match(fenceRegex); 
        if (match && match[2]) {
          newsItemsJsonStr = match[2].trim();
        }

        let newsItemsInCategory: HotNewsItemFromAPI[];
        try {
          newsItemsInCategory = JSON.parse(newsItemsJsonStr);
          if (!Array.isArray(newsItemsInCategory) || newsItemsInCategory.some(item => typeof item.title !== 'string' || typeof item.url !== 'string' || typeof item.summary !== 'string')) {
            throw new Error("잘못된 뉴스 항목 JSON 형식 또는 필수 키(title, url, summary) 누락.");
          }
        } catch (parseError: any) {
          console.error(`카테고리 '${category}'의 뉴스 목록 JSON 파싱 오류. Raw:`, newsItemsJsonStr, "Error:", parseError);
          setTopNewsGenerationStep(`카테고리 '${category}' 뉴스 파싱 실패. 다음 카테고리로 넘어갑니다.`);
          continue; 
        }

        for (const newsItem of newsItemsInCategory.slice(0, NUM_NEWS_PER_CATEGORY)) {
          const normalizedTitle = normalizeTitleForDeduplication(newsItem.title);
          if (normalizedTitle && !uniqueNewsTitles.has(normalizedTitle)) {
            const politicalKeywords = ['정치', '국회', '선거', '대통령', '정부', '여당', '야당', '의원', '장관', '정책']; 
            const isPolitical = politicalKeywords.some(kw => 
                (newsItem.title && newsItem.title.includes(kw)) || 
                (newsItem.summary && newsItem.summary.includes(kw))
            );

            if (!isPolitical) {
                allFetchedNewsItems.push({ ...newsItem, category }); 
                uniqueNewsTitles.add(normalizedTitle);
            } else {
                console.log(`정치적 콘텐츠로 인해 뉴스 건너뜀 (카테고리: ${category}): ${newsItem.title}`);
            }
          } else if (normalizedTitle && uniqueNewsTitles.has(normalizedTitle)) {
            console.log(`중복된 뉴스로 인해 건너뜀 (카테고리: ${category}): ${newsItem.title}`);
          }
        }
      } 

      setTopNewsGenerationStep(`${allFetchedNewsItems.length}개 뉴스 아이템 수집 완료. 중복 제거 및 필터링 완료. 글 생성 준비 중...`);
      
      if (allFetchedNewsItems.length === 0) {
        setTopNewsGenerationStep("생성할 뉴스 아이템이 없습니다. (필터링 후 0개). 카테고리 선택을 변경하거나 다른 커뮤니티를 시도해보세요.");
        setIsGeneratingTopNews(false);
        return;
      }

      const generatedPosts: TopNewsPostDisplayItem[] = [];
      for (let i = 0; i < allFetchedNewsItems.length; i++) {
        const news = allFetchedNewsItems[i]; 
        setTopNewsGenerationStep(`${i + 1}/${allFetchedNewsItems.length}번째 뉴스 포스팅 생성 중: "${news.title.substring(0,30)}..." (카테고리: ${news.category})`);
        
        const newsContentForPost = `제목: ${news.title}\n요약: ${news.summary}`;
        
        const postResult = await generateCommunityPostInternal(newsContentForPost, communityPrompt);

        if (!('error' in postResult)) { 
          generatedPosts.push({
            id: `topnews-${Date.now()}-${i}`,
            communityPersona: selectedCommunityForAuto,
            post: postResult, 
            originalNewsTitle: news.title,
            originalNewsLink: news.url,
            originalNewsSummary: news.summary,
            sentimentUsed: "neutral", 
            category: news.category, 
          });
        } else { 
          console.warn(`뉴스 "${news.title}"에 대한 글 생성 실패:`, postResult.error);
        }
        setGeneratedTopNewsPosts([...generatedPosts]); 
      }

      setTopNewsGenerationStep(`${generatedPosts.length}개 뉴스 포스트 생성 완료.`);
    } catch (e: any) {
      console.error("선택된 카테고리 기반 자동 뉴스 글 생성 중 주요 오류:", e);
      setError(`자동 뉴스 글 생성 실패: ${e.message}`);
      setTopNewsGenerationStep(`오류 발생: ${e.message}`);
    } finally {
      setIsGeneratingTopNews(false);
    }
  }, [aiInstance, communities, selectedCommunityForAuto, selectedNewsCategoriesForAutoPost, callGeminiApiInternal, generateCommunityPostInternal]);

  const handleCategorySelectionChange = (category: string) => {
    setSelectedNewsCategoriesForAutoPost(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };


  return (
    <div className="app-container-horizontal-tabs">
      <div className="top-header">
        <h1 className="app-title">커뮤니티 콘텐츠 생성기 ✨</h1>
        <nav className="tab-navigation">
          <button className={currentActiveTab === 'promptSettings' ? 'active-tab' : 'tab'} onClick={() => setCurrentActiveTab('promptSettings')} aria-selected={currentActiveTab === 'promptSettings'}>커뮤니티 설정</button>
          <button className={currentActiveTab === 'postGeneration' ? 'active-tab' : 'tab'} onClick={() => setCurrentActiveTab('postGeneration')} aria-selected={currentActiveTab === 'postGeneration'}>수동 게시글 생성</button>
          <button className={currentActiveTab === 'autoGeneration' ? 'active-tab' : 'tab'} onClick={() => setCurrentActiveTab('autoGeneration')} aria-selected={currentActiveTab === 'autoGeneration'}>자동 뉴스 포스팅</button>
          <button className={currentActiveTab === 'lab' ? 'active-tab' : 'tab'} onClick={() => setCurrentActiveTab('lab')} aria-selected={currentActiveTab === 'lab'}>기타 기능</button>
        </nav>
      </div>

      <div className="main-content-area">
        {error && <div className="error-message" role="alert">{error}</div>}

        {currentActiveTab === 'promptSettings' && (
          <div className="tab-pane active" id="promptSettings">
            <h3 className="tab-title">커뮤니티 페르소나 설정</h3>
            <div className="sidebar-section">
              <label htmlFor="community-name">커뮤니티 이름:</label>
              <input type="text" id="community-name" value={editingCommunityName} onChange={(e) => setEditingCommunityName(e.target.value)} placeholder="예: 뽐뿌, 맘스홀릭" />
              
              <label htmlFor="community-prompt">커뮤니티 스타일 프롬프트:</label>
              <textarea id="community-prompt" value={editingCommunityPrompt} onChange={(e) => setEditingCommunityPrompt(e.target.value)} placeholder="커뮤니티의 말투, 스타일, 사용자 특성 등을 상세히 입력..."></textarea>
              
              <div className="button-group">
                <button onClick={handleSaveCommunity} className="primary">저장/업데이트</button>
                {selectedCommunityForEdit && <button onClick={() => handleDeleteCommunity(selectedCommunityForEdit)} className="danger">선택된 커뮤니티 삭제</button>}
              </div>
            </div>
            <div className="community-list-container sidebar-section">
              <h5>저장된 커뮤니티 목록 (클릭하여 수정)</h5>
              {Object.keys(communities).length === 0 ? (<p>저장된 커뮤니티가 없습니다.</p>) : (
                <ul className="community-list">
                  {Object.keys(communities).sort().map(name => (
                    <li key={name} onClick={() => handleSelectCommunityForEdit(name)} className={selectedCommunityForEdit === name ? 'selected' : ''} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSelectCommunityForEdit(name)}>
                      {name} {selectedCommunityForEdit === name && <span className="edit-indicator">(수정 중)</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {currentActiveTab === 'postGeneration' && (
          <div className="tab-pane active" id="postGeneration">
            <h3 className="tab-title">수동 게시글 생성</h3>
            <div className="input-section-main">
              <h4>1. 게시글 유형 및 내용 입력</h4>
              <label htmlFor="post-type-select">게시글 유형:</label>
              <select 
                id="post-type-select"
                value={postType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    setPostType(e.target.value as PostType);
                    if (e.target.value === 'newsReaction') {
                        setReviewSubject('');
                        setReviewAppealPoint('');
                        // Reset review intensities if switching away from review
                        setReviewPositiveIntensity(3); 
                        setReviewNegativeIntensity(0);
                    } else {
                        setNewsInputForPost('');
                    }
                }}
                disabled={isManuallyGeneratingPost}
                style={{marginBottom: '15px'}}
              >
                <option value="newsReaction">뉴스 반응</option>
                <option value="review">후기</option>
              </select>

              {postType === 'newsReaction' && (
                <>
                  <label htmlFor="news-input">뉴스 내용:</label>
                  <textarea 
                    id="news-input"
                    value={newsInputForPost} 
                    onChange={(e) => setNewsInputForPost(e.target.value)}
                    placeholder="여기에 분석할 뉴스 기사 전문 또는 요약 내용을 붙여넣으세요..."
                    rows={8}
                    aria-label="뉴스 내용 입력란"
                    disabled={isManuallyGeneratingPost}
                  ></textarea>
                </>
              )}

              {postType === 'review' && (
                <>
                  <label htmlFor="review-subject-input">후기 대상:</label>
                  <input 
                    type="text"
                    id="review-subject-input"
                    value={reviewSubject}
                    onChange={(e) => setReviewSubject(e.target.value)}
                    placeholder="예: 아일릿 Tick-Tack 노래, 갤럭시 S24 사용 후기"
                    aria-label="후기 대상 입력란"
                    disabled={isManuallyGeneratingPost}
                    style={{marginBottom: '10px'}}
                  />
                  <label htmlFor="review-appeal-point-input">후기 소구 포인트/정보 (선택 사항):</label>
                  <textarea 
                    id="review-appeal-point-input"
                    value={reviewAppealPoint}
                    onChange={(e) => setReviewAppealPoint(e.target.value)}
                    placeholder="예: 중독성 있는 멜로디, 뛰어난 카메라 성능, 특정 이벤트의 재미있었던 점 등 후기에서 강조하고 싶은 내용을 입력하세요."
                    rows={3}
                    aria-label="후기 소구 포인트/정보 입력란"
                    disabled={isManuallyGeneratingPost}
                  ></textarea>
                </>
              )}


              <h4>2. 대상 커뮤니티 선택</h4>
              <select 
                id="community-select-post" 
                value={selectedCommunityForPost} 
                onChange={(e) => setSelectedCommunityForPost(e.target.value)}
                aria-label="대상 커뮤니티 선택"
                disabled={isManuallyGeneratingPost || Object.keys(communities).length === 0}
              >
                {Object.keys(communities).length > 0 ? Object.keys(communities).sort().map(name => <option key={name} value={name}>{name}</option>) : <option disabled>커뮤니티 없음</option>}
              </select>
              {Object.keys(communities).length === 0 && <p className="error-text">커뮤니티 설정을 먼저 추가해주세요.</p>}
              
              <h4>3. {postType === 'review' ? '후기 상세 감정 조절' : '뉴스 해석 방향 선택'}</h4>
                {postType === 'review' ? (
                    <div className="review-intensity-controls">
                        <div className="intensity-slider">
                            <label htmlFor="review-positive-intensity">긍정적 강도: {reviewPositiveIntensity}</label>
                            <input
                                type="range"
                                id="review-positive-intensity"
                                min="0"
                                max="5"
                                value={reviewPositiveIntensity}
                                onChange={(e) => setReviewPositiveIntensity(Number(e.target.value))}
                                disabled={isManuallyGeneratingPost}
                                aria-label={`긍정적 강도 ${reviewPositiveIntensity}`}
                            />
                        </div>
                        <div className="intensity-slider">
                            <label htmlFor="review-negative-intensity">부정적 강도: {reviewNegativeIntensity}</label>
                            <input
                                type="range"
                                id="review-negative-intensity"
                                min="0"
                                max="5"
                                value={reviewNegativeIntensity}
                                onChange={(e) => setReviewNegativeIntensity(Number(e.target.value))}
                                disabled={isManuallyGeneratingPost}
                                aria-label={`부정적 강도 ${reviewNegativeIntensity}`}
                            />
                        </div>
                        {(reviewPositiveIntensity === 0 && reviewNegativeIntensity === 0) && (
                            <p className="info-text small">팁: 긍정 및 부정 강도가 모두 0이면, 대상에 대한 중립적이고 객관적인 관찰이나 사실 기반 설명을 커뮤니티 스타일로 생성합니다.</p>
                        )}
                    </div>
                ) : ( // newsReaction
                    <>
                        <div id="news-summary-sentiment-label" className="sentiment-bar-container">
                            어떤 톤의 반응을 생성할까요? (초안 생성 시 반영)
                        </div>
                        <div className="sentiment-bar" role="group" aria-labelledby="news-summary-sentiment-label">
                            <button 
                                className={`sentiment-point negative-sentiment ${newsSummarySentiment === 'negative' ? 'active' : ''}`}
                                onClick={() => setNewsSummarySentiment('negative')}
                                aria-pressed={newsSummarySentiment === 'negative'}
                                disabled={isManuallyGeneratingPost}
                            >부정적</button>
                            <button 
                                className={`sentiment-point neutral-sentiment ${newsSummarySentiment === 'neutral' ? 'active' : ''}`}
                                onClick={() => setNewsSummarySentiment('neutral')}
                                aria-pressed={newsSummarySentiment === 'neutral'}
                                disabled={isManuallyGeneratingPost}
                            >중립적</button>
                            <button 
                                className={`sentiment-point positive-sentiment ${newsSummarySentiment === 'positive' ? 'active' : ''}`}
                                onClick={() => setNewsSummarySentiment('positive')}
                                aria-pressed={newsSummarySentiment === 'positive'}
                                disabled={isManuallyGeneratingPost}
                            >긍정적</button>
                        </div>
                    </>
                )}


              <button 
                onClick={handleGeneratePostsFromNews} 
                className="generate-button" 
                disabled={
                  isManuallyGeneratingPost || 
                  !selectedCommunityForPost || 
                  (postType === 'newsReaction' && !newsInputForPost.trim()) || 
                  (postType === 'review' && !reviewSubject.trim())
                }
                aria-busy={isManuallyGeneratingPost}
              >
                {isManuallyGeneratingPost ? "생성 중..." : "게시글 생성 (2단계)"}
              </button>
              {isManuallyGeneratingPost && manualPostGenerationStep && (
                <div className="inline-loader status-message" role="status">
                    <span>{manualPostGenerationStep}</span>
                </div>
              )}
            </div>

            {neutralPostStep2 && (
              <div className="results-section">
                <div className="result-block">
                  <h4>{postType === 'review' ? '후기 대상 정보 요약' : '뉴스 분석 및'} 초안 (1단계 결과)
                    <button className="copy-button" onClick={() => navigator.clipboard.writeText(neutralPostStep2)}>복사</button>
                  </h4>
                  <textarea readOnly value={neutralPostStep2} className="analysis-result" rows={6} aria-label={`${postType === 'review' ? '후기 대상 정보 요약' : '뉴스 분석 및'} 초안`}></textarea>
                </div>
              </div>
            )}
            {(generatedPostVersion1.title || generatedPostVersion1.body) && (
              <div className="results-section">
                <div className="result-block">
                  <h4>커뮤니티 스타일 글 (V1)
                    <button className="copy-button" onClick={() => navigator.clipboard.writeText(`[제목] ${generatedPostVersion1.title}\n[내용]\n${generatedPostVersion1.body}`)}>복사</button>
                  </h4>
                  <textarea readOnly value={`[제목] ${generatedPostVersion1.title}\n\n[내용]\n${generatedPostVersion1.body}`} className="post-version1" rows={10} aria-label="커뮤니티 스타일 글 버전 1"></textarea>
                </div>
              </div>
            )}
            {(generatedPostVersion2.title || generatedPostVersion2.body) && (
              <div className="results-section">
                 <div className="result-block">
                    <h4>커뮤니티 스타일 글 (V2)
                      <button className="copy-button" onClick={() => navigator.clipboard.writeText(`[제목] ${generatedPostVersion2.title}\n[내용]\n${generatedPostVersion2.body}`)}>복사</button>
                    </h4>
                    <textarea readOnly value={`[제목] ${generatedPostVersion2.title}\n\n[내용]\n${generatedPostVersion2.body}`} className="post-version2" rows={10} aria-label="커뮤니티 스타일 글 버전 2"></textarea>
                </div>
              </div>
            )}
          </div>
        )}
        
        {currentActiveTab === 'autoGeneration' && (
          <div className="tab-pane active auto-post-section" id="autoGeneration">
            <h3 className="tab-title">자동 뉴스 포스팅</h3>
            
            <div className="input-section-main">
              <h4>1. 커뮤니티 맞춤 카테고리 기반 뉴스 포스팅</h4>
              <label htmlFor="community-select-auto">대상 커뮤니티 선택:</label>
              <select 
                  id="community-select-auto" 
                  value={selectedCommunityForAuto} 
                  onChange={(e) => {
                      setSelectedCommunityForAuto(e.target.value);
                      setRecommendedNewsCategories([]); // Reset categories on community change
                      setSelectedNewsCategoriesForAutoPost([]);
                      setGeneratedTopNewsPosts([]);
                      setTopNewsGenerationStep('');
                  }}
                  disabled={isGeneratingTopNews || Object.keys(communities).length === 0}
              >
                  {Object.keys(communities).length > 0 ? Object.keys(communities).sort().map(name => <option key={name} value={name}>{name}</option>) : <option disabled>커뮤니티 없음</option>}
              </select>
              {Object.keys(communities).length === 0 && <p className="error-text">커뮤니티 설정을 먼저 추가해주세요.</p>}
              
              <button 
                  onClick={handleRecommendNewsCategories} 
                  className="generate-button"
                  disabled={isGeneratingTopNews || !selectedCommunityForAuto}
                  aria-busy={isGeneratingTopNews && topNewsGenerationStep.includes("추천 중")}
                  style={{marginBottom: '15px'}}
              >
                  {isGeneratingTopNews && topNewsGenerationStep.includes("추천 중") ? "카테고리 추천 중..." : "뉴스 카테고리 추천받기"}
              </button>

              {recommendedNewsCategories.length > 0 && !isGeneratingTopNews && (
                <div className="category-selection-section">
                  <h5>추천된 뉴스 카테고리 (클릭하여 선택):</h5>
                  <div className="category-checkbox-group">
                    {recommendedNewsCategories.map(category => (
                      <label key={category} className="category-checkbox-label">
                        <input 
                          type="checkbox"
                          value={category}
                          checked={selectedNewsCategoriesForAutoPost.includes(category)}
                          onChange={() => handleCategorySelectionChange(category)}
                          disabled={isGeneratingTopNews}
                        />
                        {category}
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleGeneratePostsFromSelectedCategories}
                    className="generate-button"
                    style={{marginTop: '15px'}}
                    disabled={isGeneratingTopNews || selectedNewsCategoriesForAutoPost.length === 0}
                    aria-busy={isGeneratingTopNews && !topNewsGenerationStep.includes("추천 중")}
                  >
                    {isGeneratingTopNews && !topNewsGenerationStep.includes("추천 중") ? "포스팅 생성 중..." : `선택 카테고리(${selectedNewsCategoriesForAutoPost.length}개) 뉴스로 포스팅 생성`}
                  </button>
                </div>
              )}
              
              {isGeneratingTopNews && topNewsGenerationStep && (
                <div className="inline-loader status-message" role="status" style={{marginTop: '10px'}}>
                    <span>{topNewsGenerationStep}</span>
                </div>
              )}
            </div>


            {generatedTopNewsPosts.length > 0 && (
              <div className="results-section auto-posts-results-container">
                <h4>생성된 자동 포스트 ({generatedTopNewsPosts.length}개)</h4>
                {generatedTopNewsPosts.map((item) => (
                  <div key={item.id} className="auto-post-card">
                    <div className="auto-post-card-header">
                      <span className="post-category-badge">{item.category || 'N/A'}</span>
                      <button className="copy-button auto-post-copy-button" onClick={() => navigator.clipboard.writeText(`[제목] ${item.post.title}\n[내용]\n${item.post.body}`)}>본문 복사</button>
                    </div>
                    <div className="original-news-section">
                      <p className="original-news-label">Source News:</p>
                      <h5 className="original-news-title">
                        <a href={item.originalNewsLink} target="_blank" rel="noopener noreferrer" title={item.originalNewsSummary}>{item.originalNewsTitle}</a>
                      </h5>
                    </div>
                    <div className="generated-post-section">
                      <p className="generated-post-label">Generated Community Post (For: {item.communityPersona})</p>
                      <h4 className="generated-post-title-display">{item.post.title}</h4>
                      <p className="generated-post-body-display" dangerouslySetInnerHTML={{ __html: item.post.body.replace(/\n/g, '<br />') }}></p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="input-section-main google-news-fetch-section">
                <h4>2. 키워드 기반 뉴스 요약 및 포스팅 (Google Search 활용)</h4>
                 <div className="api-info-warning">
                    <strong>참고:</strong> 이 기능은 Google Search를 사용하여 뉴스 내용을 가져옵니다. 
                    <ul>
                        <li>검색 결과의 품질 및 최신성은 Google Search에 따라 달라질 수 있습니다.</li>
                        <li>요청 내용에 따라 Gemini API는 Google Search 결과를 바탕으로 요약문을 생성합니다.</li>
                        <li>생성된 글의 출처 URL이 함께 표시됩니다. (표시되는 경우)</li>
                    </ul>
                </div>
                <label htmlFor="google-search-query">뉴스 검색어:</label>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px'}}>
                    <input 
                        type="text" 
                        id="google-search-query"
                        value={googleSearchQuery} 
                        onChange={(e) => setGoogleSearchQuery(e.target.value)}
                        placeholder="예: 최신 IT 기술 동향"
                        style={{flexGrow: 1, marginBottom: '0'}}
                        disabled={isFetchingKeywordNews || isGeneratingKeywordPost}
                    />
                    <button 
                        onClick={handleFetchKeywordNewsDigest} 
                        className="fetch-google-news-button"
                        disabled={isFetchingKeywordNews || isGeneratingKeywordPost || !googleSearchQuery.trim()}
                        aria-busy={isFetchingKeywordNews}
                    >
                        {isFetchingKeywordNews ? "요약 중..." : "뉴스 요약 가져오기"}
                    </button>
                </div>
                {isFetchingKeywordNews && keywordNewsFetchStatus && (
                    <div className="inline-loader status-message" role="status">
                        <span>{keywordNewsFetchStatus}</span>
                    </div>
                )}
                {keywordNewsFetchError && <p className="status-message error">{keywordNewsFetchError}</p>}

                {keywordNewsDigest && (
                    <div className="result-block">
                        <h4>검색된 뉴스 요약문
                             <button className="copy-button" onClick={() => navigator.clipboard.writeText(keywordNewsDigest)}>복사</button>
                        </h4>
                        <textarea readOnly value={keywordNewsDigest} className="analysis-result" rows={6} aria-label="검색된 뉴스 요약문"></textarea>
                        
                        {keywordNewsSources.length > 0 && (
                            <div className="news-sources-section">
                                <h5>주요 출처 ({keywordNewsSources.length}개):</h5>
                                <ul className="news-sources-list">
                                    {keywordNewsSources.map((source, idx) => (
                                        <li key={idx}>
                                            <a href={source.web?.uri} target="_blank" rel="noopener noreferrer">
                                                {source.web?.title || source.web?.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <label htmlFor="community-select-keyword-auto" style={{marginTop: '15px'}}>게시글 생성 대상 커뮤니티:</label>
                        <select 
                            id="community-select-keyword-auto" 
                            value={selectedCommunityForAuto} 
                            onChange={(e) => setSelectedCommunityForAuto(e.target.value)}
                            disabled={isGeneratingKeywordPost || Object.keys(communities).length === 0}
                            style={{marginBottom: '10px'}}
                        >
                           {Object.keys(communities).length > 0 ? Object.keys(communities).sort().map(name => <option key={name} value={name}>{name}</option>) : <option disabled>커뮤니티 없음</option>}
                        </select>
                        
                        <button 
                            onClick={async () => {
                                if (!keywordNewsDigest || !selectedCommunityForAuto || !communities[selectedCommunityForAuto]) {
                                    setError("뉴스 요약 내용과 대상 커뮤니티를 확인해주세요."); return;
                                }
                                setIsGeneratingKeywordPost(true);
                                setKeywordPostGenerationStatus("키워드 기반 게시글 생성 중...");
                                setGeneratedKeywordPost(null);
                                const communityPrompt = communities[selectedCommunityForAuto];
                                const postResult = await generateCommunityPostInternal(keywordNewsDigest, communityPrompt);
                                
                                if (!('error' in postResult)) { 
                                    setGeneratedKeywordPost({
                                        id: `keywordpost-${Date.now()}`,
                                        communityPersona: selectedCommunityForAuto,
                                        post: postResult, 
                                        originalNewsText: keywordNewsDigest,
                                        sentimentUsed: "neutral" 
                                    });
                                    setKeywordPostGenerationStatus("게시글 생성 완료!");
                                } else { 
                                    setError(postResult.error || "키워드 기반 게시글 생성 실패");
                                    setKeywordPostGenerationStatus("오류 발생. 콘솔 또는 상단 오류 메시지를 확인하세요.");
                                }
                                setIsGeneratingKeywordPost(false);
                            }}
                            className="generate-button"
                            disabled={isGeneratingKeywordPost || !keywordNewsDigest.trim() || !selectedCommunityForAuto}
                            aria-busy={isGeneratingKeywordPost}
                        >
                            {isGeneratingKeywordPost ? "생성 중..." : "이 요약으로 게시글 생성"}
                        </button>
                        {isGeneratingKeywordPost && keywordPostGenerationStatus && (
                            <div className="inline-loader status-message" style={{marginTop: '10px'}} role="status">
                                <span>{keywordPostGenerationStatus}</span>
                            </div>
                        )}
                    </div>
                )}
                {generatedKeywordPost && (
                    <div className="results-section auto-posts-results-container" style={{marginTop: '10px'}}>
                        <h4>생성된 키워드 기반 포스트</h4>
                        <div className="auto-post-card">
                           <div className="auto-post-card-header">
                             <span className="post-category-badge">키워드 기반</span>
                             <button className="copy-button auto-post-copy-button" onClick={() => navigator.clipboard.writeText(`[제목] ${generatedKeywordPost.post.title}\n[내용]\n${generatedKeywordPost.post.body}`)}>본문 복사</button>
                           </div>
                           <div className="generated-post-section">
                             <p className="generated-post-label">Generated Community Post (For: {generatedKeywordPost.communityPersona})</p>
                             <h4 className="generated-post-title-display">{generatedKeywordPost.post.title}</h4>
                             <p className="generated-post-body-display" dangerouslySetInnerHTML={{ __html: generatedKeywordPost.post.body.replace(/\n/g, '<br />') }}></p>
                           </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}


        {currentActiveTab === 'lab' && (
          <div className="tab-pane active" id="lab">
            <h3 className="tab-title">기타 기능 (댓글 생성 / 톤 변경)</h3>
            <div className="input-section-main">
              <h4>1. 댓글 생성</h4>
              <label htmlFor="original-post-comment">원본 게시글 내용:</label>
              <textarea id="original-post-comment" value={originalPostForComment} onChange={(e) => setOriginalPostForComment(e.target.value)} rows={5} placeholder="댓글을 생성할 원본 게시글 내용을 입력하세요." disabled={isGeneratingComments}></textarea>
              
              <label htmlFor="community-select-comment">대상 커뮤니티:</label>
              <select id="community-select-comment" value={selectedCommunityForComment} onChange={(e) => setSelectedCommunityForComment(e.target.value)} disabled={isGeneratingComments || Object.keys(communities).length === 0}>
                {Object.keys(communities).length > 0 ? Object.keys(communities).sort().map(name => <option key={name} value={name}>{name}</option>) : <option disabled>커뮤니티 없음</option>}
              </select>
              <button onClick={handleGenerateComments} className="generate-button" disabled={isGeneratingComments || !originalPostForComment.trim() || !selectedCommunityForComment}>
                {isGeneratingComments ? "생성 중..." : "댓글 생성"}
              </button>
              {isGeneratingComments && (
                 <div className="inline-loader status-message" role="status" style={{marginTop: '10px'}}>
                    <span>댓글 생성 중...</span>
                </div>
              )}
            </div>

            {generatedComments.length > 0 && (
              <div className="results-section">
                <h4>생성된 댓글 ({generatedComments.length}개)</h4>
                {generatedComments.map((comment, index) => (
                  <div key={index} className="result-block">
                    <textarea readOnly value={comment} rows={3} aria-label={`생성된 댓글 ${index + 1}`}></textarea>
                     <button className="copy-button" onClick={() => navigator.clipboard.writeText(comment)}>복사</button>
                  </div>
                ))}
              </div>
            )}

            <div className="input-section-main" style={{marginTop: '30px'}}>
              <h4>2. 자유 텍스트 톤 변경</h4>
              <label htmlFor="original-text-tonechange">원본 텍스트:</label>
              <textarea id="original-text-tonechange" value={textForToneChange} onChange={(e) => setTextForToneChange(e.target.value)} rows={5} placeholder="톤을 변경할 원본 텍스트를 입력하세요." disabled={isChangingTone}></textarea>
              
              <label htmlFor="community-select-tonechange">대상 커뮤니티 스타일:</label>
              <select id="community-select-tonechange" value={selectedCommunityForToneChange} onChange={(e) => setSelectedCommunityForToneChange(e.target.value)} disabled={isChangingTone ||Object.keys(communities).length === 0}>
                {Object.keys(communities).length > 0 ? Object.keys(communities).sort().map(name => <option key={name} value={name}>{name}</option>) : <option disabled>커뮤니티 없음</option>}
              </select>
              <button onClick={handleToneChange} className="generate-button" disabled={isChangingTone || !textForToneChange.trim() || !selectedCommunityForToneChange}>
                {isChangingTone ? "변환 중..." : "스타일 변환"}
              </button>
              {isChangingTone && (
                <div className="inline-loader status-message" role="status" style={{marginTop: '10px'}}>
                    <span>톤 변경 중...</span>
                </div>
              )}
            </div>

            {toneChangedText && (
              <div className="results-section">
                 <div className="result-block">
                  <h4>변환된 텍스트
                    <button className="copy-button" onClick={() => navigator.clipboard.writeText(toneChangedText)}>복사</button>
                  </h4>
                  <textarea readOnly value={toneChangedText} rows={7} aria-label="변환된 텍스트"></textarea>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
      <App />
  );
} else {
  console.error("Fatal Error: Root element with ID 'root' not found in the DOM.");
}