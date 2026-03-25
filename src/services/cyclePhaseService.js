/**
 * Utility service for calculating menstrual cycle phases and statistics.
 * This provides reusable logic for the menstrual tracker dashboard and components.
 */

export const CYCLE_PHASES = {
    MENSTRUAL: 'Menstrual',
    FOLLICULAR: 'Follicular',
    OVULATION: 'Ovulation',
    LUTEAL: 'Luteal'
};

/**
 * Determines the cycle phase based on the current cycle day.
 * 
 * @param {number} cycleDay - Current day of the cycle (1-based)
 * @param {number} cycleLength - Average cycle length
 * @param {number} periodLength - Average period duration
 * @returns {string} The name of the current cycle phase
 */
export const getCyclePhaseLabel = (cycleDay, cycleLength, periodLength) => {
    const midpoint = cycleLength / 2;

    // Menstrual phase: cycleDay 1 – periodLength
    if (cycleDay >= 1 && cycleDay <= periodLength) {
        return CYCLE_PHASES.MENSTRUAL;
    }

    // Follicular phase: cycleDay periodLength+1 – cycleLength/2 - 3
    if (cycleDay > periodLength && cycleDay <= (midpoint - 3)) {
        return CYCLE_PHASES.FOLLICULAR;
    }

    // Ovulation phase: cycleDay cycleLength/2 - 2 → cycleLength/2 + 2
    if (cycleDay >= (midpoint - 2) && cycleDay <= (midpoint + 2)) {
        return CYCLE_PHASES.OVULATION;
    }

    // Luteal phase: cycleDay after ovulation → cycleLength
    // This covers anything after midpoint + 2 up to the end of the specified cycleLength
    return CYCLE_PHASES.LUTEAL;
};

/**
 * Calculates the current cycle status from user inputs.
 * 
 * @param {Date|string} lastPeriodStartDate - Start date of the last period
 * @param {number} averageCycleLength - Average length of the cycle in days
 * @param {number} averagePeriodLength - Average length of the period in days
 * @param {Date|string} [currentDate=new Date()] - The date to calculate for
 * @returns {Object} { cycleDay, cyclePhase, daysUntilNextPeriod, predictedNextPeriodDate }
 */
export const calculateCyclePhase = (
    lastPeriodStartDate,
    averageCycleLength,
    averagePeriodLength,
    currentDate = new Date()
) => {
    const start = new Date(lastPeriodStartDate);
    const current = new Date(currentDate);

    // Reset time portions to ensure day-based calculation accuracy
    start.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    // cycleDay = difference between currentDate and lastPeriodStartDate + 1
    const diffInMs = current.getTime() - start.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Handle case where currentDate is before lastPeriodStartDate
    if (diffInDays < 0) {
        return {
            cycleDay: 0,
            cyclePhase: 'Awaiting Cycle',
            daysUntilNextPeriod: Math.abs(diffInDays),
            predictedNextPeriodDate: start
        };
    }

    // Calculate current cycle day relative to most recent cycle start
    // This handles situations where multiple cycles have passed since the recorded start date
    const cycleDay = (diffInDays % averageCycleLength) + 1;
    const cyclePhase = getCyclePhaseLabel(cycleDay, averageCycleLength, averagePeriodLength);

    // Predicted Next Period Date: the start of the next future cycle
    const cyclesPassed = Math.floor(diffInDays / averageCycleLength);
    const predictedNextPeriodDate = new Date(start);
    predictedNextPeriodDate.setDate(start.getDate() + ((cyclesPassed + 1) * averageCycleLength));

    // Days until next period
    const daysUntilMs = predictedNextPeriodDate.getTime() - current.getTime();
    const daysUntilNextPeriod = Math.max(0, Math.ceil(daysUntilMs / (1000 * 60 * 60 * 24)));

    return {
        cycleDay,
        cyclePhase,
        daysUntilNextPeriod,
        predictedNextPeriodDate
    };
};
