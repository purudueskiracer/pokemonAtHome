/**
 * useMart — ViewModel hook for the Mart screen.
 *
 * Owns: item selection, daily limit tracking, purchase toast state.
 * The purchase sub-flow (answering questions) is handled by usePurchaseFlow.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { MART_ITEMS } from "../data/martItems";
import { BALL_CAPS } from "../config/GameConfig";

/**
 * @returns {{
 *   profile: Object,
 *   items: Array,
 *   buying: Object|null,
 *   lastPurchased: Object|null,
 *   purchasedToday: Object,
 *   handleBuy: (item: Object) => void,
 *   handleComplete: (item: Object) => void,
 *   handleCancel: () => void,
 *   isBagFull: (item: Object) => boolean,
 *   isAtLimit: (item: Object) => boolean,
 * }}
 */
export function useMart() {
  const profile = useGameStore((s) => s.profile);
  const [buying, setBuying] = useState(null);
  const [lastPurchased, setLastPurchased] = useState(null);
  const [purchasedToday, setPurchasedToday] = useState({});

  // ── Timer cleanup ───────────────────────────────────────────────
  const toastTimerRef = useRef(null);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const isAtLimit = useCallback(
    (item) => {
      const todayCount = purchasedToday[item.id] ?? 0;
      return !!(item.dailyLimit && todayCount >= item.dailyLimit);
    },
    [purchasedToday]
  );

  const isBagFull = useCallback(
    (item) => {
      if (!item.ballType) return false;
      return (profile.balls?.[item.ballType] ?? 0) >= (BALL_CAPS[item.ballType] ?? 30);
    },
    [profile.balls]
  );

  const handleBuy = useCallback(
    (item) => {
      if (isAtLimit(item) || isBagFull(item)) return;
      setBuying(item);
    },
    [isAtLimit, isBagFull]
  );

  const handleComplete = useCallback((item) => {
    setBuying(null);
    setLastPurchased(item);
    setPurchasedToday((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] ?? 0) + 1,
    }));
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setLastPurchased(null), 3000);
  }, []);

  const handleCancel = useCallback(() => {
    setBuying(null);
  }, []);

  // Pre-computed ball counts for the view (no raw profile access needed)
  const ballCounts = {
    pokeball: profile.balls?.pokeball ?? 0,
    greatball: profile.balls?.greatball ?? 0,
    ultraball: profile.balls?.ultraball ?? 0,
  };

  return {
    profile,
    ballCounts,
    items: MART_ITEMS,
    buying,
    lastPurchased,
    purchasedToday,
    handleBuy,
    handleComplete,
    handleCancel,
    isBagFull,
    isAtLimit,
  };
}

/**
 * usePurchaseFlow — ViewModel hook for the question-answering purchase sub-flow.
 *
 * Manages the multi-question quiz that earns a mart item.
 */

import { getOneQuestion } from "../data/questions/index";
import { MART_XP } from "../config/GameConfig";

/**
 * @param {{ item: Object, profile: Object, onComplete: (item) => void }} params
 */
export function usePurchaseFlow({ item, profile, onComplete }) {
  const addBalls = useGameStore((s) => s.addBalls);
  const addXp = useGameStore((s) => s.addXp);

  const subjects = ["math", "reading", "space"];
  const grade = Math.max(...Object.values(profile.subjects).map((s) => s.grade));

  const [answered, setAnswered] = useState(0);
  const [selected, setSelected] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [currentQ, setCurrentQ] = useState(() => {
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    return getOneQuestion({ subject, grade });
  });

  // ── Track all setTimeout IDs; clear on unmount ────────────────────
  const timerRef = useRef(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const progress = Math.round((answered / item.questionCount) * 100);

  const handleAnswer = useCallback(
    (ans) => {
      if (selected !== null) return;
      setSelected(ans);
      setWasCorrect(ans.correct);

      if (ans.correct) {
        addXp(MART_XP);
        const newCount = answered + 1;
        if (newCount >= item.questionCount) {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            addBalls(item.reward.pokeball, item.reward.greatball, item.reward.ultraball);
            onComplete(item);
          }, 800);
        } else {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setAnswered(newCount);
            setSelected(null);
            setWasCorrect(null);
            const nextSubject = subjects[Math.floor(Math.random() * subjects.length)];
            setCurrentQ(getOneQuestion({ subject: nextSubject, grade }));
          }, 800);
        }
      } else {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setSelected(null);
          setWasCorrect(null);
          const nextSubject = subjects[Math.floor(Math.random() * subjects.length)];
          setCurrentQ(getOneQuestion({ subject: nextSubject, grade }));
        }, 1200);
      }
    },
    [selected, answered, item, grade, addXp, addBalls, onComplete]
  );

  return {
    answered,
    selected,
    wasCorrect,
    currentQ,
    progress,
    handleAnswer,
  };
}
