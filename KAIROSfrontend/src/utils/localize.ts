import i18n from '@/i18n'

// Canonical crop mappings
export const CROP_LOCALIZATIONS: Record<string, { mr: string; hi: string; en: string }> = {
  'Rice': { en: 'Rice', mr: 'भात (तांदूळ)', hi: 'धान (चावल)' },
  'Banana': { en: 'Banana', mr: 'केळी', hi: 'केला' },
  'Wheat': { en: 'Wheat', mr: 'गहू', hi: 'गेहूँ' },
  'Sugarcane': { en: 'Sugarcane', mr: 'ऊस', hi: 'गन्ना' },
  'Cotton': { en: 'Cotton', mr: 'कापूस', hi: 'कपास' },
  'Soybean': { en: 'Soybean', mr: 'सोयाबीन', hi: 'सोयाबीन' },
  'Onion': { en: 'Onion', mr: 'कांदा', hi: 'प्याज' },
  'Orange': { en: 'Orange', mr: 'संत्री', hi: 'संतरा' },
  'Bajra': { en: 'Bajra', mr: 'बाजरी', hi: 'बाजरा' },
  'Jowar': { en: 'Jowar', mr: 'ज्वारी', hi: 'ज्वार' }
}

// Complete 74 canonical threats + common variations
export const THREAT_LOCALIZATIONS: Record<string, { mr: string; hi: string; en: string }> = {
  // Banana
  'Banana Moko Disease': { en: 'Banana Moko Disease', mr: 'केळीवरील मोको जिवाणू रोग', hi: 'केले का मोको जीवाणु रोग' },
  'Banana_Moko_Disease': { en: 'Banana Moko Disease', mr: 'केळीवरील मोको जिवाणू रोग', hi: 'केले का मोको जीवाणु रोग' },
  'Banana Black Sigatoka Disease': { en: 'Banana Black Sigatoka Disease', mr: 'केळीवरील ब्लॅक सिगाटोका करपा', hi: 'केले का ब्लैक सिगाटोका रोग' },
  'Banana_Black_Sigatoka': { en: 'Black Sigatoka', mr: 'ब्लॅक सिगाटोका करपा', hi: 'ब्लैक सिगाटोका' },
  'Black Sigatoka': { en: 'Black Sigatoka', mr: 'ब्लॅक सिगाटोका करपा', hi: 'ब्लैक सिगाटोका' },
  'Banana Bract Mosaic Virus Disease': { en: 'Banana Bract Mosaic Virus Disease', mr: 'केळीवरील ब्रॅक्ट मोझॅक विषाणूजन्य रोग', hi: 'केले का ब्रैक्ट मोज़ेक विषाणु रोग' },
  'Banana_Bract_Mosaic_Virus': { en: 'Banana Bract Mosaic Virus Disease', mr: 'केळीवरील ब्रॅक्ट मोझॅक विषाणूजन्य रोग', hi: 'केले का ब्रैक्ट मोज़ेक विषाणु रोग' },
  'Banana Panama Disease': { en: 'Banana Panama Disease (Fusarium Wilt)', mr: 'केळीवरील पनामा मर रोग (फ्युसॅरियम)', hi: 'केले का पनामा रोग (उकठा)' },
  'Banana_Panama_Disease': { en: 'Panama Wilt (Fusarium)', mr: 'पनामा मर रोग (फ्युसॅरियम)', hi: 'पनामा रोग / उकठा' },
  'Banana Yellow Sigatoka Disease': { en: 'Banana Yellow Sigatoka Disease', mr: 'केळीवरील यलो सिगाटोका करपा', hi: 'केले का येलो सिगाटोका रोग' },
  'Banana_Yellow_Sigatoka': { en: 'Yellow Sigatoka', mr: 'यलो सिगाटोका करपा', hi: 'येलो सिगाटोका' },
  'Banana Insect Pest Disease': { en: 'Banana Insect Pest Infestation', mr: 'केळीवरील कीड व किडीचा प्रादुर्भाव', hi: 'केले में कीट और कीट प्रकोप' },
  'Rhizome weevil': { en: 'Rhizome Weevil', mr: 'केळीचा कंद भुंगा / खोडकिडा', hi: 'केले का कंद घुन कीट' },
  'Banana_Aphid': { en: 'Banana Aphid', mr: 'केळीवरील मावा कीड', hi: 'केले का माहू' },

  // Rice
  'Anthracnose and Red Rot': { en: 'Anthracnose and Red Rot', mr: 'अँथ्रॅकनोज आणि तांबेरा / लाल कुजव्या', hi: 'एंथ्रेक्नोज और लाल सड़न रोग' },
  'Cereal Grain molds': { en: 'Grain Mold', mr: 'दाण्यावरील बुरशी / मोल्ड', hi: 'दाना फफूंद रोग' },
  'Covered Kernel smut': { en: 'Covered Kernel Smut', mr: 'काजळी रोग / काणी', hi: 'कंडुआ रोग' },
  'Head smut': { en: 'Head Smut', mr: 'कणीस काजळी रोग', hi: 'हेड स्मट / कंडुआ' },
  'loose smut': { en: 'Loose Smut', mr: 'मोकळी काजळी रोग', hi: 'खुला कंडुआ' },
  'Rust': { en: 'Rust Disease', mr: 'तांबेरा रोग', hi: 'रतुआ रोग' },
  'Grasshopper': { en: 'Grasshopper', mr: 'नाकतोडा', hi: 'टिड्डा कीट' },
  'Stem borer': { en: 'Stem Borer', mr: 'खोडकीड', hi: 'तना छेदक' },
  'Bacterial Leaf Blight': { en: 'Bacterial Leaf Blight', mr: 'जिवाणूजन्य पान करपा', hi: 'जीवाणु पत्ती झुलसा' },
  'Bacterial_Leaf_Blight': { en: 'Bacterial Leaf Blight', mr: 'जिवाणूजन्य पान करपा', hi: 'जीवाणु पत्ती झुलसा' },
  'Brown Spot': { en: 'Brown Spot', mr: 'तपकिरी ठिपके रोग', hi: 'भूरा धब्बा रोग' },
  'Brown_Spot': { en: 'Brown Spot', mr: 'तपकिरी ठिपके रोग', hi: 'भूरा धब्बा रोग' },
  'Rice Brown Spot': { en: 'Rice Brown Spot', mr: 'भातावरील तपकिरी ठिपके', hi: 'धान का भूरा धब्बा रोग' },
  'Rice_Brown_Spot': { en: 'Rice Brown Spot', mr: 'भातावरील तपकिरी ठिपके', hi: 'धान का भूरा धब्बा रोग' },
  'Leaf Blast': { en: 'Leaf Blast', mr: 'भातावरील करपा (ब्लास्ट)', hi: 'पत्ती ब्लास्ट रोग' },
  'Rice Blast': { en: 'Rice Blast', mr: 'भातावरील करपा', hi: 'धान का ब्लास्ट रोग' },
  'Rice_Blast': { en: 'Rice Blast', mr: 'भातावरील करपा', hi: 'धान का ब्लास्ट रोग' },
  'Leaf scald': { en: 'Leaf Scald', mr: 'पाने करपणे रोग', hi: 'लीफ स्कैल्ड' },
  'Sheath Blight': { en: 'Sheath Blight', mr: 'शीथ ब्लाइट रोग', hi: 'शीथ ब्लाइट रोग' },
  'Rice Sheath Blight': { en: 'Rice Sheath Blight', mr: 'भातावरील शीथ ब्लाइट', hi: 'धान का शीथ ब्लाइट' },
  'Rice_Sheath_Blight': { en: 'Rice Sheath Blight', mr: 'भातावरील शीथ ब्लाइट', hi: 'धान का शीथ ब्लाइट' },
  'BPH (Brown Planthopper)': { en: 'Brown Planthopper (BPH)', mr: 'तपकिरी तुडतुडे (BPH)', hi: 'भूरा फुदका (BPH)' },
  'Brown Planthopper': { en: 'Brown Planthopper', mr: 'तपकिरी तुडतुडे', hi: 'भूरा फुदका' },
  'Brown_Planthopper': { en: 'Brown Planthopper', mr: 'तपकिरी तुडतुडे', hi: 'भूरा फुदका' },
  'Leaf folder': { en: 'Leaf Folder', mr: 'पाने गुंडाळणारी अळी', hi: 'पत्ती लपेटक कीट' },
  'Rice gall midge': { en: 'Gall Midge', mr: 'गादमाशी', hi: 'गाल मिज' },

  // Wheat & Cereals
  'Black Rust': { en: 'Black Stem Rust', mr: 'काळा तांबेरा रोग', hi: 'काला रतुआ रोग' },
  'Blast': { en: 'Blast Disease', mr: 'करपा रोग', hi: 'ब्लास्ट रोग' },
  'Brown Rust': { en: 'Brown Leaf Rust', mr: 'तपकिरी तांबेरा रोग', hi: 'भूरा रतुआ रोग' },
  'Common Root Rot': { en: 'Root Rot', mr: 'मूळ कुजव्या रोग', hi: 'जड़ सड़न रोग' },
  'Fusarium Head Blight': { en: 'Fusarium Head Blight', mr: 'फ्युसॅरियम कणीस करपा', hi: 'कंडुआ / हेड ब्लाइट' },
  'Leaf Blight': { en: 'Leaf Blight', mr: 'पानावरील करपा', hi: 'पत्ती झुलसा' },
  'Mildew': { en: 'Mildew Disease', mr: 'भुरी / केवडा रोग', hi: 'मिल्ड्यू रोग' },
  'Septoria': { en: 'Septoria Leaf Blotch', mr: 'सेप्टोरिया ठिपके', hi: 'सेप्टोरिया धब्बा' },
  'Smut': { en: 'Smut', mr: 'काजळी रोग', hi: 'कंडुआ रोग' },
  'Stem fly': { en: 'Stem Fly', mr: 'खोडमाशी', hi: 'तना मक्खी' },
  'Tan spot': { en: 'Tan Spot', mr: 'पिवळसर ठिपके रोग', hi: 'टैन स्पॉट' },
  'Yellow Rust': { en: 'Yellow Stripe Rust', mr: 'पिवळा तांबेरा रोग', hi: 'पीला रतुआ रोग' },
  'White grub': { en: 'White Grub', mr: 'हुमणी अळी', hi: 'सफेद लट / ग्रब' },

  // Cotton & Sugarcane
  'Aphids': { en: 'Aphids', mr: 'मावा कीड', hi: 'माहू कीड' },
  'Mosaic': { en: 'Mosaic Virus', mr: 'मोझॅक विषाणू रोग', hi: 'मोज़ेक वायरस रोग' },
  'RedRot': { en: 'Red Rot', mr: 'उसावरील लाल कुजव्या', hi: 'गन्ने का लाल सड़न रोग' },
  'Yellow': { en: 'Yellow Leaf Disease', mr: 'पिवळे पडणे रोग', hi: 'पीली पत्ती रोग' },
  'Bacterial Blight': { en: 'Bacterial Blight', mr: 'जिवाणूजन्य करपा', hi: 'जीवाणु झुलसा' },
  'Curl Virus': { en: 'Leaf Curl Virus', mr: 'पान चुरगळणे विषाणू', hi: 'पत्ती मरोड़ वायरस' },
  'Herbicide Growth Damage': { en: 'Herbicide Growth Damage (Abiotic)', mr: 'तणनाशकामुळे झालेली पिकाची हानी (अजैविक)', hi: 'खरपतवारनाशक से फसल क्षति (अजैविक)' },
  'Leaf Hopper Jassids': { en: 'Jassids / Leaf Hoppers', mr: 'तुडतुडे / जॅसिड्स', hi: 'फुदका / जैसिड' },
  'Leaf Redding': { en: 'Leaf Redding (Abiotic Stress)', mr: 'पाने लाल पडणे (अजैविक तणाव)', hi: 'पत्तियों का लाल होना (अजैविक तनाव)' },
  'Leaf Variegation': { en: 'Leaf Variegation (Abiotic)', mr: 'पानांचा रंग बदलणे (अजैविक)', hi: 'पत्ती विरंजन (अजैविक)' },
  'Whitefly': { en: 'Whitefly', mr: 'पांढरी माशी', hi: 'सफेद मक्खी' },
  'Pink Bollworm': { en: 'Pink Bollworm', mr: 'गुलाबी बोंडअळी', hi: 'गुलाबी सुंडी' },

  // Soybean & Onion
  'Cercospora Leaf Blight': { en: 'Cercospora Leaf Blight', mr: 'सार्कोस्पोरा पान करपा', hi: 'सर्कोस्पोरा पत्ती झुलसा' },
  'Sudden Death Syndrome': { en: 'Sudden Death Syndrome (SDS)', mr: 'झाडे अकस्मात वाळणे रोग (SDS)', hi: 'अचानक सूखा रोग (SDS)' },
  'Tobacco caterpillar': { en: 'Tobacco Caterpillar (Spodoptera)', mr: 'लष्करी अळी / स्पोडोप्टेरा', hi: 'तम्बाकू की इल्ली' },
  'Alternaria_D': { en: 'Alternaria Leaf Spot', mr: 'अल्टरनेरिया ठिपके', hi: 'अल्टरनेरिया धब्बा रोग' },
  'Botrytis Leaf Blight': { en: 'Botrytis Blight', mr: 'बोट्रीटिस करपा', hi: 'बोट्रीटिस झुलसा' },
  'Bulb Rot': { en: 'Bulb Rot', mr: 'कांदा सडणे रोग', hi: 'कंद सड़न रोग' },
  'Bulb_blight-D': { en: 'Bulb Blight', mr: 'कांदा करपा रोग', hi: 'कंद झुलसा रोग' },
  'Caterpillar-P': { en: 'Caterpillar Infestation', mr: 'अळीचा प्रादुर्भाव', hi: 'इल्ली का प्रकोप' },
  'Downy mildew': { en: 'Downy Mildew', mr: 'केवडा / डाउनी मिल्ड्यू रोग', hi: 'डाउनी मिल्ड्यू' },
  'Fusarium-D': { en: 'Fusarium Wilt', mr: 'फ्युसॅरियम मर रोग', hi: 'फ्युसैरियम उकठा रोग' },
  'Iris yellow virus_augument': { en: 'Iris Yellow Spot Virus', mr: 'पिवळे ठिपके विषाणू रोग', hi: 'पीला धब्बा वायरस' },
  'onion1': { en: 'Onion Foliar Disorder', mr: 'कांद्यावरील पानावरील विकार', hi: 'प्याज पत्ती विकार' },
  'Purple blotch': { en: 'Purple Blotch', mr: 'कांद्यावरील जांभळा करपा', hi: 'प्याज का बैंगनी धब्बा रोग' },
  'Purple Blotch': { en: 'Purple Blotch', mr: 'कांद्यावरील जांभळा करपा', hi: 'प्याज का बैंगनी धब्बा रोग' },
  'stemphylium Leaf Blight': { en: 'Stemphylium Leaf Blight', mr: 'स्टेमफिलियम करपा रोग', hi: 'स्टेमफिलियम झुलसा रोग' },
  'Virosis-D': { en: 'Viral Foliar Disease', mr: 'विषाणूजन्य पान रोग', hi: 'विषाणु जनित रोग' },
  'Xanthomonas Leaf Blight': { en: 'Xanthomonas Leaf Blight', mr: 'झँथोमोनास जिवाणू करपा', hi: 'जैंथोमोनास जीवाणु झुलसा' },
  'Thrips': { en: 'Thrips Infestation', mr: 'फुलकिडे (थ्रिप्स) प्रादुर्भाव', hi: 'थ्रिप्स का प्रकोप' },

  // Citrus / Orange
  'Black spot': { en: 'Black Spot Disease', mr: 'काळे ठिपके रोग', hi: 'काला धब्बा रोग' },
  'Canker': { en: 'Citrus Canker', mr: 'संत्र्यावरील खैऱ्या रोग (कँकर)', hi: 'नींबू वर्गीय कैंकर रोग' },
  'Greening': { en: 'Citrus Greening (HLB)', mr: 'सिट्रस ग्रीनिंग रोग', hi: 'सिट्रस ग्रीनिंग रोग' },
  'Scab': { en: 'Citrus Scab', mr: 'संत्र्यावरील खरुज रोग', hi: 'सिट्रस स्कैब रोग' },
  'Fruit fly': { en: 'Fruit Fly', mr: 'फळमाशी', hi: 'फल मक्खी' },
  'Leaf miner': { en: 'Citrus Leaf Miner', mr: 'संत्र्यावरील पाने पोखरणारी अळी', hi: 'पत्ती सुरंग कीट' },

  // General & Baselines
  'Baseline Crop Monitoring': { en: 'Baseline Crop Monitoring', mr: 'नियमित पीक निरीक्षण', hi: 'नियमित फसल निगरानी' },
  'General Crop Health': { en: 'General Crop Health', mr: 'सामान्य पीक आरोग्य स्थिती', hi: 'सामान्य फसल स्वास्थ्य स्थिति' },
  'Healthy': { en: 'Healthy Crop', mr: 'निरोगी पीक', hi: 'स्वस्थ फसल' },
  'Optimal': { en: 'Optimal Growth Baseline', mr: 'उत्तम पीक वाढ', hi: 'उत्तम फसल वृद्धि' }
}

// Canonical severity translations
export const SEVERITY_LOCALIZATIONS: Record<string, { mr: string; hi: string; en: string }> = {
  'CRITICAL': { en: 'Critical Threat', mr: 'अत्यंत गंभीर धोका', hi: 'अत्यंत गंभीर जोखिम' },
  'Critical': { en: 'Critical', mr: 'गंभीर', hi: 'गंभीर' },
  'HIGH': { en: 'High Risk', mr: 'जास्त धोका', hi: 'अधिक जोखिम' },
  'High': { en: 'High', mr: 'जास्त', hi: 'अधिक' },
  'MODERATE': { en: 'Moderate Risk', mr: 'मध्यम धोका', hi: 'मध्यम जोखिम' },
  'Moderate': { en: 'Moderate', mr: 'मध्यम', hi: 'मध्यम' },
  'LOW': { en: 'Low Risk', mr: 'कमी धोका', hi: 'कम जोखिम' },
  'Low': { en: 'Low', mr: 'कमी', hi: 'कम' },
  'NONE': { en: 'Healthy Baseline', mr: 'निरोगी स्थिती', hi: 'स्वस्थ स्थिति' },
  'None': { en: 'None', mr: 'काहीही नाही', hi: 'कोई नहीं' },
  'Optimal': { en: 'Optimal', mr: 'उत्तम', hi: 'उत्तम' }
}

/**
 * Localize Crop Name
 */
export function localizeCrop(cropName: string | undefined | null): string {
  if (!cropName) return ''
  const lang = (i18n.language || 'en') as 'en' | 'mr' | 'hi'
  const match = CROP_LOCALIZATIONS[cropName]
  if (match && match[lang]) {
    return match[lang]
  }
  return cropName
}

/**
 * Localize Threat / Disease / Pest Name
 */
export function localizeThreat(threatName: string | undefined | null): string {
  if (!threatName) return ''
  const lang = (i18n.language || 'en') as 'en' | 'mr' | 'hi'

  // Exact match
  if (THREAT_LOCALIZATIONS[threatName] && THREAT_LOCALIZATIONS[threatName][lang]) {
    return THREAT_LOCALIZATIONS[threatName][lang]
  }

  // Normalized key (e.g. replace underscores or spaces)
  const normalizedWithUnderscore = threatName.replace(/ /g, '_')
  if (THREAT_LOCALIZATIONS[normalizedWithUnderscore] && THREAT_LOCALIZATIONS[normalizedWithUnderscore][lang]) {
    return THREAT_LOCALIZATIONS[normalizedWithUnderscore][lang]
  }

  const normalizedWithSpace = threatName.replace(/_/g, ' ')
  if (THREAT_LOCALIZATIONS[normalizedWithSpace] && THREAT_LOCALIZATIONS[normalizedWithSpace][lang]) {
    return THREAT_LOCALIZATIONS[normalizedWithSpace][lang]
  }

  return threatName
}

/**
 * Localize Severity / Risk String
 */
export function localizeSeverity(severity: string | undefined | null): string {
  if (!severity) return ''
  const lang = (i18n.language || 'en') as 'en' | 'mr' | 'hi'
  const match = SEVERITY_LOCALIZATIONS[severity]
  if (match && match[lang]) {
    return match[lang]
  }
  return severity
}

/**
 * Localize dynamic Diagnostic Rationale sentences
 */
export function localizeRationale(text: string | undefined | null): string {
  if (!text) return ''
  const lang = (i18n.language || 'en') as 'en' | 'mr' | 'hi'
  if (lang === 'en') return text

  let localized = text

  if (lang === 'mr') {
    // Advisory headlines
    localized = localized
      .replace(/🚨?\s*Urgent Treatment Advisory:\s*([^on\n]+)\s+on\s+([^\n\.]+)/gi, (_, threat, crop) => {
        return `🚨 तातडीचा उपचार सल्ला: ${localizeThreat(threat.trim())} (${localizeCrop(crop.trim())} पीक)`
      })
      .replace(/🛡️?\s*Preventive Action Advisory:\s*([^on\n]+)\s+on\s+([^\n\.]+)/gi, (_, threat, crop) => {
        return `🛡️ प्रतिबंधात्मक कृती सल्ला: ${localizeThreat(threat.trim())} (${localizeCrop(crop.trim())} पीक)`
      })
      .replace(/🔍?\s*Monitoring & Surveillance Advisory:\s*([^on\n]+)\s+on\s+([^\n\.]+)/gi, (_, threat, crop) => {
        return `🔍 पीक निरीक्षण व देखरेख सल्ला: ${localizeThreat(threat.trim())} (${localizeCrop(crop.trim())} पीक)`
      })
      .replace(/High humidity and favorable environmental conditions/gi, 'जास्त आर्द्रता आणि रोगास अनुकूल पर्यावरणीय परिस्थिती')
      .replace(/Favorable conditions detected for disease spread/gi, 'रोग प्रसारासाठी अनुकूल हवामान परिस्थिती आढळली')
      .replace(/Vision model detected/gi, 'AI कॅमेरा तपासणीत आढळले')
      .replace(/with high confidence/gi, 'उच्च विश्वासार्हतेसह')
      .replace(/with moderate confidence/gi, 'मध्यम विश्वासार्हतेसह')
      .replace(/System analysis indicates optimal growth conditions across all parameters\./gi, 'सर्व घटकांवरून पिकासाठी पोषक आणि अनुकूल परिस्थिती दिसून येत आहे.')
      .replace(/System analysis indicates optimal growth conditions across all parameters/gi, 'सर्व घटकांवरून पिकासाठी पोषक आणि अनुकूल परिस्थिती दिसून येत आहे')
      .replace(/Cross-verified by multimodal telemetry feeds/gi, 'मल्टीमॉडल टेलिमेट्री द्वारे पडताळणी पूर्ण')
      .replace(/detected on crop/gi, 'पिकावर आढळला')
  } else if (lang === 'hi') {
    // Advisory headlines
    localized = localized
      .replace(/🚨?\s*Urgent Treatment Advisory:\s*([^on\n]+)\s+on\s+([^\n\.]+)/gi, (_, threat, crop) => {
        return `🚨 तत्काल उपचार सलाह: ${localizeThreat(threat.trim())} (${localizeCrop(crop.trim())} फसल)`
      })
      .replace(/🛡️?\s*Preventive Action Advisory:\s*([^on\n]+)\s+on\s+([^\n\.]+)/gi, (_, threat, crop) => {
        return `🛡️ निवारक कार्रवाई सलाह: ${localizeThreat(threat.trim())} (${localizeCrop(crop.trim())} फसल)`
      })
      .replace(/🔍?\s*Monitoring & Surveillance Advisory:\s*([^on\n]+)\s+on\s+([^\n\.]+)/gi, (_, threat, crop) => {
        return `🔍 फसल निगरानी और देखरेख सलाह: ${localizeThreat(threat.trim())} (${localizeCrop(crop.trim())} फसल)`
      })
      .replace(/High humidity and favorable environmental conditions/gi, 'अधिक आर्द्रता और रोग के अनुकूल पर्यावरणीय परिस्थितियाँ')
      .replace(/Favorable conditions detected for disease spread/gi, 'रोग फैलाव के लिए अनुकूल मौसम परिस्थितियां पाई गईं')
      .replace(/Vision model detected/gi, 'AI कैमरा जांच में पाया गया')
      .replace(/with high confidence/gi, 'उच्च विश्वास स्तर के साथ')
      .replace(/with moderate confidence/gi, 'मध्यम विश्वास स्तर के साथ')
      .replace(/System analysis indicates optimal growth conditions across all parameters\./gi, 'सभी पैरामीटर फसल के लिए अनुकूल और स्वस्थ स्थिति दर्शाते हैं।')
      .replace(/System analysis indicates optimal growth conditions across all parameters/gi, 'सभी पैरामीटर फसल के लिए अनुकूल और स्वस्थ स्थिति दर्शाते हैं')
      .replace(/Cross-verified by multimodal telemetry feeds/gi, 'मल्टीमॉडल टेलीमेट्री द्वारा सत्यापित')
      .replace(/detected on crop/gi, 'फसल पर पाया गया')
  }

  // Also replace any remaining threat names in the text
  for (const [, trans] of Object.entries(THREAT_LOCALIZATIONS)) {
    if (localized.includes(trans.en) && trans[lang]) {
      localized = localized.split(trans.en).join(trans[lang])
    }
  }

  return localized
}

/**
 * Localize dynamic Agronomist Advisory Action sentences
 */
export function localizeAction(text: string | undefined | null): string {
  if (!text) return ''
  const lang = (i18n.language || 'en') as 'en' | 'mr' | 'hi'
  if (lang === 'en') return text

  let localized = text

  if (lang === 'mr') {
    // Specific quarantine directives
    localized = localized
      .replace(/High-consequence bacterial quarantine disease\.\s*Quarantine the area immediately\.\s*Inject affected pseudostem and a 5-meter buffer radius of mats with Glyphosate \(20 ml\/mat\)\.\s*Rogue and incinerate dead pseudostems in situ\.\s*Drench infected soil spot with Bleaching Powder \(30 g\/m2\) or 2% Copper Oxychloride\.\s*Prohibit movement of suckers, soil, and tools from the plot\./gi,
        'अत्यंत घातक जिवाणूजन्य क्वारंटाईन रोग. बाधित क्षेत्राला तात्काळ क्वारंटाईन करा. बाधित खोड आणि ५ मीटर परिसरातील झाडांमध्ये ग्लायफोसेट (२० मिली/झाड) इंजेक्ट करा. मृत खोडे जागेवरच जाळून नष्ट करा. बाधित माती ब्लीचिंग पावडर (३० ग्रॅम/चौ.मी.) किंवा २% कॉपर ऑक्सिक्लोराईडने भिजवून निर्जंतुक करा. शेतातून रोपे, माती आणि अवजारांची ने-आण करण्यास तात्काळ बंदी घाला.')
      .replace(/BIOSECURITY WARNING:\s*High-consequence vascular\/epidemic pathogen\.\s*Follow mandatory quarantine containment,\s*eradicate infected plants via deep burial\/burning,\s*and report incidence to the local Assistant Director of Agriculture\./gi,
        'जैविक सुरक्षा इशारा: अत्यंत घातक संसर्गजन्य रोग. अनिवार्य क्वारंटाईन नियमांचे पालन करा, बाधित झाडे खोल खड्ड्यात पुरून किंवा जाळून नष्ट करा आणि स्थानिक कृषी अधिकाऱ्यांशी तात्काळ संपर्क साधा.')
      .replace(/STRICT SAFETY GUARDRAIL:\s*Non-parasitic abiotic condition detected\.\s*Chemical insecticides and fungicides are strictly prohibited to avoid phytotoxicity\.\s*Apply corrective irrigation,\s*drainage,\s*and foliar anti-stress nutrition only\./gi,
        'कडक सुरक्षा इशारा: गैर-परजीवी अजैविक स्थिती आढळली. पिकाची हानी टाळण्यासाठी रासायनिक कीटकनाशके व बुरशीनाशकांचा वापर पूर्णपणे वर्ज्य आहे. केवळ पाणी व्यवस्थापन, योग्य निचरा आणि ताण निवारक विद्राव्य खतांची फवारणी करा.')
      .replace(/Apply the approved fungicide according to the recommended dosage\./gi, 'शिफारस केलेल्या मात्रेनुसार मंजूर बुरशीनाशकाचा वापर करा.')
      .replace(/Apply the approved insecticide according to the recommended dosage\./gi, 'शिफारस केलेल्या मात्रेनुसार मंजूर कीटकनाशकाचा वापर करा.')
      .replace(/Monitor the crop for the next (\d+) days\./gi, 'पुढील $1 दिवस पिकाचे बारकाईने निरीक्षण करा.')
      .replace(/Monitor crop closely for the next (\d+) days\./gi, 'पुढील $1 दिवस पिकाचे बारकाईने निरीक्षण करा.')
      .replace(/Follow the product label and required safety precautions\./gi, 'उत्पादनाच्या लेबलवरील सूचना आणि आवश्यक सुरक्षा उपायांचे पालन करा.')
      .replace(/Observe the required Pre-Harvest Interval \(PHI\) of (\d+) days\./gi, 'आवश्यक काढणीपूर्व प्रतीक्षा कालावधी ($1 दिवस) पाळा.')
      .replace(/Observe the required Pre-Harvest Interval of (\d+) days\./gi, 'आवश्यक काढणीपूर्व प्रतीक्षा कालावधी ($1 दिवस) पाळा.')
      .replace(/Do not exceed the recommended dosage\./gi, 'शिफारस केलेल्या मात्रेपेक्षा जास्त वापर करू नका.')
      .replace(/Keep children and livestock away from the treated area\./gi, 'उपचार केलेल्या क्षेत्रापासून मुले आणि पशुधन दूर ठेवा.')
      .replace(/Maintain current agronomic schedule\./gi, 'सध्याचे कृषी वेळापत्रक कायम ठेवा.')
      .replace(/Sanitary deleafing of heavily infected lower leaves/gi, 'जास्त बाधित झालेली खालची पाने काढून नष्ट करा')
      .replace(/Apply/gi, 'वापर करा:')
      .replace(/Dosage:/gi, 'मात्रा:')
      .replace(/Pre-Harvest Interval:/gi, 'काढणीपूर्व प्रतीक्षा कालावधी:')
      .replace(/Safety:/gi, 'सुरक्षितता:')
      .replace(/Monitoring:/gi, 'निरीक्षण:')
  } else if (lang === 'hi') {
    // Specific quarantine directives
    localized = localized
      .replace(/High-consequence bacterial quarantine disease\.\s*Quarantine the area immediately\.\s*Inject affected pseudostem and a 5-meter buffer radius of mats with Glyphosate \(20 ml\/mat\)\.\s*Rogue and incinerate dead pseudostems in situ\.\s*Drench infected soil spot with Bleaching Powder \(30 g\/m2\) or 2% Copper Oxychloride\.\s*Prohibit movement of suckers, soil, and tools from the plot\./gi,
        'अत्यंत गंभीर जीवाणु क्वारंटाइन रोग। प्रभावित क्षेत्र को तुरंत अलग (क्वारंटाइन) करें। प्रभावित तने और 5 मीटर दायरे के पौधों में ग्लाइफोसेट (20 मिली/पौधा) इंजेक्ट करें। मृत तनों को वहीं जलाकर नष्ट करें। संक्रमित मिट्टी को ब्लीचिंग पाउडर (30 ग्राम/वर्ग मीटर) या 2% कॉपर ऑक्सीक्लोराइड से उपचारित करें। खेत से कंद, मिट्टी और कृषि उपकरणों की आवाजाही तुरंत रोकें।')
      .replace(/BIOSECURITY WARNING:\s*High-consequence vascular\/epidemic pathogen\.\s*Follow mandatory quarantine containment,\s*eradicate infected plants via deep burial\/burning,\s*and report incidence to the local Assistant Director of Agriculture\./gi,
        'जैव-सुरक्षा चेतावनी: अत्यंत गंभीर संवहनी/महामारी रोग। अनिवार्य क्वारंटाइन नियमों का पालन करें, संक्रमित पौधों को गहरा दबाकर या जलाकर नष्ट करें और स्थानीय कृषि अधिकारी को सूचित करें।')
      .replace(/STRICT SAFETY GUARDRAIL:\s*Non-parasitic abiotic condition detected\.\s*Chemical insecticides and fungicides are strictly prohibited to avoid phytotoxicity\.\s*Apply corrective irrigation,\s*drainage,\s*and foliar anti-stress nutrition only\./gi,
        'सख्त सुरक्षा नियम: गैर-परजीवी अजैविक स्थिति पाई गई। फसल विषाक्तता से बचने के लिए रासायनिक कीटनाशकों और कवकनाशकों का प्रयोग पूरी तरह वर्जित है। केवल सुधारात्मक सिंचाई, जल निकासी और तनाव-रोधी पोषण का प्रयोग करें।')
      .replace(/Apply the approved fungicide according to the recommended dosage\./gi, 'अनुशंसित मात्रा के अनुसार स्वीकृत फफूंदनाशक का उपयोग करें।')
      .replace(/Apply the approved insecticide according to the recommended dosage\./gi, 'अनुशंसित मात्रा के अनुसार स्वीकृत कीटनाशक का उपयोग करें।')
      .replace(/Monitor the crop for the next (\d+) days\./gi, 'अगले $1 दिनों तक फसल की बारीकी से निगरानी करें।')
      .replace(/Monitor crop closely for the next (\d+) days\./gi, 'अगले $1 दिनों तक फसल की बारीकी से निगरानी करें।')
      .replace(/Follow the product label and required safety precautions\./gi, 'उत्पाद के लेबल पर दिए निर्देशों और आवश्यक सुरक्षा सावधानियों का पालन करें।')
      .replace(/Observe the required Pre-Harvest Interval \(PHI\) of (\d+) days\./gi, 'आवश्यक कटाई-पूर्व अंतराल ($1 दिन) का पालन करें।')
      .replace(/Observe the required Pre-Harvest Interval of (\d+) days\./gi, 'आवश्यक कटाई-पूर्व अंतराल ($1 दिन) का पालन करें।')
      .replace(/Do not exceed the recommended dosage\./gi, 'अनुशंसित मात्रा से अधिक उपयोग न करें।')
      .replace(/Keep children and livestock away from the treated area\./gi, 'उपचारित क्षेत्र से बच्चों और पशुओं को दूर रखें।')
      .replace(/Maintain current agronomic schedule\./gi, 'वर्तमान कृषि कार्यक्रम बनाए रखें।')
      .replace(/Sanitary deleafing of heavily infected lower leaves/gi, 'अधिक संक्रमित निचली पत्तियों को काटकर नष्ट करें')
      .replace(/Apply/gi, 'उपयोग करें:')
      .replace(/Dosage:/gi, 'मात्रा:')
      .replace(/Pre-Harvest Interval:/gi, 'कटाई-पूर्व अंतराल:')
      .replace(/Safety:/gi, 'सुरक्षा:')
      .replace(/Monitoring:/gi, 'निगरानी:')
  }

  return localized
}
