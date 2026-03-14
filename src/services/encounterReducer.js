/**
 * encounterReducer — pure reducer for the encounter FSM.
 *
 * Every legal state transition is explicit. The reducer is testable
 * without React — dispatch actions, assert state.
 *
 * @see {import('../types').EncounterState}
 * @see {import('../types').EncounterPhase}
 * @see {import('../types').CatchOutcome}
 */

/**
 * @typedef {Object} EncounterReducerState
 * @property {import('../types').EncounterPhase}   phase
 * @property {import('../types').CatchOutcome}     catchResult
 * @property {import('../types').CatchResult|null} catchDetails
 * @property {Object|null}                         selectedAnswer
 * @property {Object|null}                         question
 */

/** @returns {EncounterReducerState} */
export function createInitialState(question = null) {
  return {
    phase:          "question",
    catchResult:    null,
    catchDetails:   null,
    selectedAnswer: null,
    question,
  };
}

/**
 * Action types (kept as string constants for simplicity).
 * In a larger app these could be an enum or union type.
 */
export const ACTIONS = {
  SET_QUESTION:     "SET_QUESTION",
  ANSWER_SELECTED:  "ANSWER_SELECTED",  // show selection on any answer (correct or wrong)
  ANSWER_CORRECT:   "ANSWER_CORRECT",
  ANSWER_WRONG:     "ANSWER_WRONG",
  POKEMON_FLED:     "POKEMON_FLED",
  FAILED_WRONG:     "FAILED_WRONG",
  THROW_START:      "THROW_START",
  CATCH_RESULT:     "CATCH_RESULT",
  RETRY:            "RETRY",
};

/**
 * Pure reducer — no side effects, no timers.
 * Timers are driven by useEffect in the hook layer reacting to state changes.
 *
 * @param {EncounterReducerState} state
 * @param {{ type: string, [key: string]: any }} action
 * @returns {EncounterReducerState}
 */
export function encounterReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_QUESTION:
      return { ...state, question: action.question };

    case ACTIONS.ANSWER_CORRECT:
      return {
        ...state,
        selectedAnswer: action.answer,
        phase: "encounter",
      };

    // Shows the selected answer visually without changing phase (correct or wrong path)
    case ACTIONS.ANSWER_SELECTED:
      return { ...state, selectedAnswer: action.answer };

    case ACTIONS.ANSWER_WRONG:
      return { ...state, selectedAnswer: action.answer };

    case ACTIONS.POKEMON_FLED:
      return { ...state, phase: "result", catchResult: "fled" };

    case ACTIONS.FAILED_WRONG:
      return { ...state, phase: "result", catchResult: "failed_wrong" };

    case ACTIONS.THROW_START:
      return { ...state, phase: "throwing" };

    case ACTIONS.CATCH_RESULT:
      return {
        ...state,
        phase: "result",
        catchResult: "caught",
        catchDetails: action.details,
      };

    case ACTIONS.RETRY:
      return {
        ...state,
        phase: "question",
        selectedAnswer: null,
        question: action.question ?? state.question,
      };

    default:
      return state;
  }
}
