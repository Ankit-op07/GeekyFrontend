/**
 * Shared quiz limits.
 *
 * This exists because the cap was defined twice with different values — 5 in the
 * questions API, 3 in the static starter set — so the number of questions a
 * learner saw depended on which code path served them. One constant, one answer.
 */

/**
 * Max questions rendered under a single topic.
 *
 * The lesson is the product; the quiz is a self-check at the end of it. Three is
 * enough to make someone retrieve rather than recognise (PRD-005 §1) without
 * turning the foot of every page into homework. Authoring targets 3/topic, so
 * this is a safety ceiling rather than a live constraint.
 */
export const MAX_QUESTIONS_PER_TOPIC = 3;
