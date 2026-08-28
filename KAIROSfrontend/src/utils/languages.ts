export interface LanguageConfig {
  code: string
  name: string
  nativeName: string
  speechRecLocale: string
  speechSynthLocale: string
  isPrimary: boolean
  suggestedQuestions: string[]
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (IN)',
    speechRecLocale: 'en-IN',
    speechSynthLocale: 'en-IN',
    isPrimary: true,
    suggestedQuestions: [
      "What is my pest risk for the next 7 days?",
      "What disease was detected on my crop?",
      "What is the current live temperature and humidity?",
      "What treatment did the recommendation engine advise?",
      "Why is my crop risk elevated?",
      "What is my soil moisture reading?"
    ]
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    speechRecLocale: 'mr-IN',
    speechSynthLocale: 'mr-IN',
    isPrimary: true,
    suggestedQuestions: [
      "माझ्या पिकाचा पुढील ७ दिवसांचा किडीचा धोका किती आहे?",
      "माझ्या शेवटच्या तपासणीत कोणता रोग आढळला?",
      "शेतातील सध्याचे थेट तापमान आणि आर्द्रता किती आहे?",
      "KAIROS शिफारस इंजिनने कोणता उपाय सुचवला आहे?",
      "पिकाचा धोका का वाढला आहे?",
      "मातीतील ओलावा किती आहे?"
    ]
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    speechRecLocale: 'hi-IN',
    speechSynthLocale: 'hi-IN',
    isPrimary: true,
    suggestedQuestions: [
      "मेरी फसल में अगले 7 दिनों का कीट जोखिम कितना है?",
      "मेरी अंतिम जांच में कौन सा रोग पाया गया?",
      "खेत का वर्तमान लाइव तापमान और आर्द्रता कितनी है?",
      "KAIROS सिफारिश इंजन ने क्या उपचार सुझाया है?",
      "फसल का जोखिम अधिक क्यों है?",
      "मृदा नमी कितनी है?"
    ]
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    speechRecLocale: 'ta-IN',
    speechSynthLocale: 'ta-IN',
    isPrimary: true,
    suggestedQuestions: [
      "அடுத்த 7 நாட்களில் எனது பயிரின் பூச்சி ஆபத்து எவ்வளவு?",
      "எனது கடைசி சோதனையில் என்ன நோய் கண்டறியப்பட்டது?",
      "பண்ணையின் நேரலை வெப்பநிலை மற்றும் ஈரப்பதம் எவ்வளவு?",
      "KAIROS பரிந்துரை இயந்திரம் என்ன சிகிச்சை பரிந்துரைத்துள்ளது?",
      "பயிர் ஆபத்து ஏன் அதிகரித்துள்ளது?",
      "மண் ஈரப்பதம் எவ்வளவு?"
    ]
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    speechRecLocale: 'te-IN',
    speechSynthLocale: 'te-IN',
    isPrimary: false,
    suggestedQuestions: [
      "నా పంటకు పురుగుల ముప్పు ఎంత?",
      "ప్రస్తుత ఉష్ణోగ్రత ఎంత?",
      "నేను ఇప్పుడు ఏమి చేయాలి?"
    ]
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    speechRecLocale: 'kn-IN',
    speechSynthLocale: 'kn-IN',
    isPrimary: false,
    suggestedQuestions: [
      "ನನ್ನ ಬೆಳೆಗೆ ಕೀಟಗಳ ಅಪಾಯ ಎಷ್ಟು?",
      "ಪ್ರಸ್ತುತ ತಾಪಮಾನ ಎಷ್ಟು?",
      "ನಾನು ಈಗ ಏನು ಮಾಡಬೇಕು?"
    ]
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    speechRecLocale: 'bn-IN',
    speechSynthLocale: 'bn-IN',
    isPrimary: false,
    suggestedQuestions: [
      "আমার ফসলে পোকার ঝুঁকি কতটা?",
      "বর্তমান তাপমাত্রা কত?",
      "এখন আমার কি করা উচিত?"
    ]
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    speechRecLocale: 'gu-IN',
    speechSynthLocale: 'gu-IN',
    isPrimary: false,
    suggestedQuestions: [
      "મારા પાકમાં જીવાતનું જોખમ કેટલું છે?",
      "હાલનું તાપમાન કેટલું છે?",
      "મારે હવે શું કરવું જોઈએ?"
    ]
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    speechRecLocale: 'pa-IN',
    speechSynthLocale: 'pa-IN',
    isPrimary: false,
    suggestedQuestions: [
      "ਮੇਰੀ ਫਸਲ ਵਿੱਚ ਕੀੜਿਆਂ ਦਾ ਖ਼ਤਰਾ ਕਿੰਨਾ ਹੈ?",
      "ਮੌਜੂਦਾ ਤਾਪਮਾਨ ਕਿੰਨਾ ਹੈ?",
      "ਮੈਨੂੰ ਹੁਣ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ?"
    ]
  }
]

export function getLanguageConfig(code: string): LanguageConfig {
  const norm = code.split('-')[0].toLowerCase()
  return SUPPORTED_LANGUAGES.find(l => l.code === norm) || SUPPORTED_LANGUAGES[0]
}
