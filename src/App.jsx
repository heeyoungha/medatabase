import React, { useState, useRef, useEffect } from "react";
import { extractEmotionAndActions, getEmotionPolarity } from "./openai";
import Chart from "chart.js/auto";

// 긍정 감정 예시
const positiveEmotions = ["기쁨", "감사", "행복", "설렘", "희망", "평온", "사랑", "만족"];
// 부정 감정 예시
const negativeEmotions = ["불안", "슬픔", "분노", "후회", "외로움", "두려움", "짜증", "지침"];

function getPolarity(emotion) {
  if (positiveEmotions.includes(emotion)) return 1;
  if (negativeEmotions.includes(emotion)) return -1;
  return 0; // 중립
}

function App() {
  const [input, setInput] = useState("");
  const [emotions, setEmotions] = useState([]);
  const [actions, setActions] = useState({});
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [loading, setLoading] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState([]);

  const chartRef = useRef();
  const chartInstance = useRef();

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: emotionHistory.map(e => e.date),
        datasets: [
          {
            label: "감정 그래프",
            data: emotionHistory.map(e => e.polarity),
            fill: false,
            borderColor: "#36a2eb",
            tension: 0.2,
          },
        ],
      },
      options: {
        scales: {
          y: {
            min: -1,
            max: 1,
            ticks: {
              callback: value => (value === 1 ? "긍정" : value === -1 ? "부정" : "중립"),
            },
          },
        },
      },
    });
  }, [emotionHistory]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await extractEmotionAndActions(input);
      setEmotions(result.감정);
      setActions(result.액션리스트);
    } catch (e) {
      alert("분석에 실패했습니다.");
    }
    setLoading(false);
  };

  const handleSaveEmotion = async () => {
    if (!selectedEmotion) return;
    const today = new Date().toISOString().slice(0, 10);
    // OpenAI로 긍/부정 판별
    const polarity = await getEmotionPolarity(selectedEmotion);
    setEmotionHistory([
      ...emotionHistory,
      {
        date: today,
        emotion: selectedEmotion,
        polarity,
      },
    ]);
    setSelectedEmotion("");
    setInput("");
    setEmotions([]);
    setActions({});
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 20 }}>
      <h2>오늘의 감정 기록</h2>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={5}
        style={{ width: "100%" }}
        placeholder="오늘 있었던 일을 적어보세요"
      />
      <button onClick={handleAnalyze} disabled={loading || !input}>
        {loading ? "분석 중..." : "감정 분석"}
      </button>

      {emotions.length > 0 && (
        <div>
          <h3>감정 선택</h3>
          {emotions.map(emotion => (
            <button
              key={emotion}
              onClick={() => setSelectedEmotion(emotion)}
              style={{
                margin: 4,
                background: selectedEmotion === emotion ? "#ffd700" : "#eee",
              }}
            >
              {emotion}
            </button>
          ))}
        </div>
      )}

      {selectedEmotion && actions[selectedEmotion] && (
        <div>
          <h3>추천 액션리스트</h3>
          <ul>
            {actions[selectedEmotion].map((act, idx) => (
              <li key={idx}>{act}</li>
            ))}
          </ul>
          <button onClick={handleSaveEmotion}>감정 기록 & 그래프에 추가</button>
        </div>
      )}

      {emotionHistory.length > 0 && (
        <div>
          <h3>감정 그래프</h3>
          <canvas ref={chartRef} width={400} height={200}></canvas>
          <ul>
            {emotionHistory.map((e, i) => (
              <li key={i}>
                {e.date} - {e.emotion} ({e.polarity === 1 ? "긍정" : e.polarity === -1 ? "부정" : "중립"})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;