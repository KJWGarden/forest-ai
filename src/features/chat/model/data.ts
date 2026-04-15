export const EXAMPLE_QUESTIONS = [
  "이 꽃 이름이 뭐야?",
  "숲에서 볼 수 있는 약초 알려줘",
  "단풍은 왜 색이 변하는 거야?",
  "소나무와 잣나무는 어떻게 구별해?",
  "도토리는 어떤 나무에서 떨어져?",
  "숲에서 만날 수 있는 야생화 알려줘",
  "이 나뭇잎이 어떤 나무인지 알려줘",
  "숲 체험할 때 주의할 점이 뭐야?",
];

export function getRandomExampleQuestions(count = 2) {
  const shuffled = [...EXAMPLE_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
