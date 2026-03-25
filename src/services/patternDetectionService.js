import { db } from "../firebase/config";
import { collection, query, where, getDocs, doc, setDoc, Timestamp } from "firebase/firestore";
import { getCycleData, getCycleStats } from "./cycleService";
import { getEmotionalTrendData } from "./moodService";

/**
 * Personal Pattern Detection System
 * Analyzes past cycles to find recurring emotional patterns.
 */

const PHASES = {
    MENSTRUAL: 'Menstrual',
    FOLLICULAR: 'Follicular',
    OVULATION: 'Ovulation',
    LUTEAL: 'Luteal',
    PMS: 'Late Luteal (PMS)'
};

export const detectPersonalPatterns = async (userId) => {
    try {
        console.log("🔍 [Pattern Detection] Starting analysis for user:", userId);

        // 1. Fetch Cycle Data
        const cycleDataMap = await getCycleData(userId);
        const cycleStats = await getCycleStats(userId);
        const entries = Object.values(cycleDataMap).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Find period starts
        const periodStarts = entries
            .filter(e => e.periodStatus === 'start' || (e.periodStatus === 'ongoing' && !cycleDataMap[new Date(new Date(e.date) - 86400000).toISOString().split('T')[0]]))
            .map(e => new Date(e.date));

        if (periodStarts.length < 2) {
            return { hasData: false, message: "More cycle history needed for pattern detection (at least 2 cycles)." };
        }

        // 2. Fetch Emotional Data
        // Get all historical emotional data for accurate comparison across cycles
        const emotionalTrendData = await getEmotionalTrendData(userId, 'all');
        const rawMoods = emotionalTrendData.rawPoints || [];

        // 3. Group Cycles
        const cycles = [];
        for (let i = 0; i < periodStarts.length - 1; i++) {
            const start = periodStarts[i];
            const end = periodStarts[i + 1];
            const cycleLength = Math.floor((end - start) / (1000 * 60 * 60 * 24));

            // Collect moods for this specific cycle
            const cycleMoods = rawMoods.filter(m => {
                const d = new Date(m.rawTimestamp);
                return d >= start && d < end;
            });

            if (cycleMoods.length > 0) {
                cycles.push({
                    start,
                    end,
                    length: cycleLength,
                    moods: cycleMoods
                });
            }
        }

        // Only take last 5 cycles
        const recentCycles = cycles.slice(-5);

        // 4. Analyze Phases per Cycle
        const phaseAverages = {
            [PHASES.MENSTRUAL]: [],
            [PHASES.FOLLICULAR]: [],
            [PHASES.OVULATION]: [],
            [PHASES.LUTEAL]: [],
            [PHASES.PMS]: []
        };

        recentCycles.forEach(cycle => {
            cycle.moods.forEach(mood => {
                const moodDate = new Date(mood.rawTimestamp);
                const dayOfCycle = Math.floor((moodDate - cycle.start) / (1000 * 60 * 60 * 24)) + 1;

                let phase = PHASES.FOLLICULAR;
                if (dayOfCycle <= 5) phase = PHASES.MENSTRUAL;
                else if (dayOfCycle >= cycle.length - 3) phase = PHASES.PMS;
                else if (dayOfCycle >= cycle.length - 10) phase = PHASES.LUTEAL;
                else if (dayOfCycle >= 12 && dayOfCycle <= 16) phase = PHASES.OVULATION;

                phaseAverages[phase].push(mood.y);
            });
        });

        // 5. Detect Patterns
        const detectedPatterns = [];
        const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

        const menstrualAvg = avg(phaseAverages[PHASES.MENSTRUAL]);
        const follicularAvg = avg(phaseAverages[PHASES.FOLLICULAR]);
        const ovulationAvg = avg(phaseAverages[PHASES.OVULATION]);
        const lutealAvg = avg(phaseAverages[PHASES.LUTEAL]);
        const pmsAvg = avg(phaseAverages[PHASES.PMS]);

        // Pattern: Pre-period mood dip
        if (pmsAvg && follicularAvg && pmsAvg < follicularAvg - 0.45) {
            detectedPatterns.push({
                type: 'mood_dip',
                severity: 'significant',
                message: `Over the past ${recentCycles.length} cycles, your mood tends to dip slightly 2–3 days before your period.`
            });
        }

        // Pattern: Ovulation boost
        if (ovulationAvg && follicularAvg && ovulationAvg > follicularAvg + 0.3) {
            detectedPatterns.push({
                type: 'ovulation_boost',
                severity: 'positive',
                message: "You often experience a noticeable boost in energy and mood during your ovulation window."
            });
        }

        // Pattern: Luteal sensitivity
        if (lutealAvg && follicularAvg && lutealAvg < follicularAvg - 0.3) {
            detectedPatterns.push({
                type: 'luteal_sensitivity',
                severity: 'moderate',
                message: "We've noticed a pattern of increased emotional sensitivity during your luteal phase."
            });
        }

        // Pattern: Menstrual recovery
        if (menstrualAvg && pmsAvg && menstrualAvg > pmsAvg + 0.2) {
            detectedPatterns.push({
                type: 'menstrual_recovery',
                severity: 'positive',
                message: "Interestingly, your mood often starts to lift as soon as your period begins."
            });
        }

        // 6. Save to Firestore
        const result = {
            userId,
            cycleCountAnalyzed: recentCycles.length,
            detectedAt: Timestamp.now(),
            patterns: detectedPatterns,
            hasData: detectedPatterns.length > 0
        };

        if (detectedPatterns.length > 0) {
            const patternRef = doc(db, "users", userId, "insights", "personal_patterns");
            await setDoc(patternRef, result);
        }

        return result;

    } catch (error) {
        console.error("❌ [Pattern Detection] Error:", error);
        return { hasData: false, message: "Analysis failed." };
    }
};

export const getStoredPatterns = async (userId) => {
    try {
        const patternDoc = await getDocs(query(collection(db, "users", userId, "insights"), where("__name__", "==", "personal_patterns")));
        if (patternDoc.empty) return null;
        return patternDoc.docs[0].data();
    } catch (error) {
        console.error("Error fetching stored patterns:", error);
        return null;
    }
};
