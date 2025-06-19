import axios from "axios";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export async function extractEmotionAndActions(text) {
  const prompt = `
너는 감정 분석가야.
아래의 사용자가 작성한 일기에서 느껴지는 감정을 한글로 3개 추출해줘.
그리고 각 감정에 대해, 부정적이면 회복할 수 있는 액션리스트 3개, 긍정적이면 극대화할 수 있는 액션리스트 3개를 한글로 제안해줘.

형식 예시:
{
  "감정": ["기쁨", "불안", "감사"],
  "액션리스트": {
    "기쁨": ["좋았던 순간을 기록하기", "친구와 공유하기", "스스로 칭찬하기"],
    "불안": ["심호흡하기", "산책하기", "마음 챙김 명상하기"],
    "감사": ["감사일기 쓰기", "고마운 사람에게 메시지 보내기", "자신을 칭찬하기"]
  }
}

사용자 입력:
${text}
`;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  // 응답에서 JSON 부분만 추출
  const content = response.data.choices[0].message.content;
  // JSON 파싱
  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}") + 1;
  const jsonString = content.slice(jsonStart, jsonEnd);
  return JSON.parse(jsonString);
}