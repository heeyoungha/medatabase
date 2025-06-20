import React, { useState, useRef, useEffect } from "react";
import { extractEmotionAndActions, getEmotionPolarity } from "./openai";
import Chart from "chart.js/auto";
import "./App.css";

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
  const [analyzed, setAnalyzed] = useState(false); // 분석 완료 여부

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
      setAnalyzed(true); // 분석 완료
    } catch (e) {
      alert("분석에 실패했습니다.");
    }
    setLoading(false);
  };

  // 입력이 바뀌면 분석 상태 초기화
  useEffect(() => {
    setAnalyzed(false);
    setSelectedEmotion("");
  }, [input]);

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
    setAnalyzed(false);
  };

  return (
    <div style={{ width: '90vw', maxWidth: 500, margin: "auto", padding: 20 }}>
      <h2>오늘의 감정 기록</h2>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={5}
        className="journal-area"
        placeholder="오늘 있었던 일을 적어보세요"
      />
      <button className="analyze-btn" onClick={handleAnalyze} disabled={loading || !input || analyzed}>
        {loading ? "분석 중..." : "감정 분석"}
      </button>

      {emotions.length > 0 && (
        <div className="section">
          <div className="section-title">감정 선택</div>
          {emotions.map(emotionObj => (
            <button
              key={emotionObj.이름}
              onClick={() => setSelectedEmotion(emotionObj.이름)}
              className={
                "emotion-btn" + (selectedEmotion === emotionObj.이름 ? " selected" : "")
              }
              title={emotionObj.설명}
            >
              {emotionObj.이름}
            </button>
          ))}
          <ul style={{ marginTop: 12 }}>
            {emotions.map(emotionObj => (
              <li key={emotionObj.이름} style={{ marginBottom: 12 }}>
                <b>{emotionObj.이름}</b>
                <br />
                <span style={{ color: "#888" }}>{emotionObj.예시}</span>
                <br />
                {emotionObj.설명}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedEmotion && actions[selectedEmotion] && (
        <div className="section">
          <div className="section-title">추천 액션리스트</div>
          {actions[selectedEmotion].카테고리.map(cat => (
            <div key={cat.이름} style={{ marginBottom: 16 }}>
              <b>{cat.이름}</b>
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>액션</th>
                    <th>설명</th>
                    <th>시간</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.액션.map((act, idx) => (
                    <tr key={idx}>
                      <td><span className="emoji">💡</span>{act.행동}</td>
                      <td>{act.설명}</td>
                      <td>{act.시간}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <div className="tip-box">
            <span className="emoji">🌟</span>
            <b>핵심 팁:</b> {actions[selectedEmotion].핵심팁}
          </div>
          <div className="routine-box">
            <span className="emoji">🗓️</span>
            <b>추천 루틴:</b>
            <ul style={{ margin: 0, marginTop: 6 }}>
              {actions[selectedEmotion].추천루틴.map((r, idx) => (
                <li key={idx}>
                  <span className="emoji">⏰</span>{r.시간대} - {r.내용} <span className="emoji">🛠️</span>({r.툴})
                </li>
              ))}
            </ul>
          </div>
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