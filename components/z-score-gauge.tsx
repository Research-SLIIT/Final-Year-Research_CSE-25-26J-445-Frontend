"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, CheckCircle, HelpCircle } from "lucide-react"

interface ZScoreGaugeProps {
    currentScore: number
    predictedScore: number
    showBothScores?: boolean
}

// Altman Z-Score thresholds
const DISTRESS_THRESHOLD = 1.81
const SAFE_THRESHOLD = 2.99

// Scale configuration - showing range from 0 to 5 for better visualization
const MIN_SCORE = 0
const MAX_SCORE = 5

const getZoneInfo = (score: number) => {
    if (score < DISTRESS_THRESHOLD) {
        return {
            zone: 'Distress',
            color: '#ef4444',
            bgColor: 'bg-red-500',
            description: 'High bankruptcy risk',
            icon: AlertTriangle,
            textColor: 'text-red-400'
        }
    } else if (score <= SAFE_THRESHOLD) {
        return {
            zone: 'Grey',
            color: '#f59e0b',
            bgColor: 'bg-amber-500',
            description: 'Uncertain outlook',
            icon: HelpCircle,
            textColor: 'text-amber-400'
        }
    } else {
        return {
            zone: 'Safe',
            color: '#22c55e',
            bgColor: 'bg-emerald-500',
            description: 'Financially healthy',
            icon: CheckCircle,
            textColor: 'text-emerald-400'
        }
    }
}

const calculatePosition = (score: number): number => {
    // Clamp score to visible range
    const clampedScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, score))
    return ((clampedScore - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100
}

export function ZScoreGauge({ currentScore, predictedScore, showBothScores = true }: ZScoreGaugeProps) {
    const [isAnimated, setIsAnimated] = useState(false)

    const predictedPosition = calculatePosition(predictedScore)
    const currentPosition = calculatePosition(currentScore)
    const distressPosition = calculatePosition(DISTRESS_THRESHOLD)
    const safePosition = calculatePosition(SAFE_THRESHOLD)

    const predictedZoneInfo = getZoneInfo(predictedScore)
    const currentZoneInfo = getZoneInfo(currentScore)

    useEffect(() => {
        const timer = setTimeout(() => setIsAnimated(true), 100)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="w-full space-y-6">
            {/* Zone Legend */}
            <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-sm shadow-red-500/30" />
                    <span className="text-muted-foreground">Distress <span className="text-red-400">(&lt;1.81)</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shadow-sm shadow-amber-500/30" />
                    <span className="text-muted-foreground">Grey <span className="text-amber-400">(1.81-2.99)</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/30" />
                    <span className="text-muted-foreground">Safe <span className="text-emerald-400">(&gt;2.99)</span></span>
                </div>
            </div>

            {/* Gauge Container */}
            <div className="relative px-2 py-4">
                {/* Current Score Marker - ABOVE the gauge */}
                {showBothScores && (
                    <motion.div
                        className="absolute top-0"
                        style={{ left: `${currentPosition}%`, transform: 'translateX(-50%)' }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={isAnimated ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.4, duration: 0.6, type: "spring", stiffness: 100 }}
                    >
                        {/* <div className="flex flex-col items-center">
                            <div className="text-xs text-muted-foreground/80 mb-1 whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-md">
                                Current: <span className="font-semibold">{currentScore.toFixed(2)}</span>
                            </div>
                            <div className="w-0.5 h-3 bg-white/40" />
                            <div
                                className="w-3 h-3 rounded-full border-2 border-white/60 shadow-lg"
                                style={{ backgroundColor: currentZoneInfo.color }}
                            />
                        </div> */}

                    </motion.div>
                )}

                {/* Scale markers - above the gauge */}
                <div className="flex justify-between text-[10px] text-muted-foreground/60 mb-1 px-1">
                    <span>0</span>
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                </div>

                {/* Gauge Track - with margin for markers */}
                <div className="relative h-5 rounded-full overflow-hidden shadow-inner mt-2">
                    {/* Gradient Background */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(to right, 
                #dc2626 0%, 
                #dc2626 ${distressPosition}%, 
                #ef4444 ${distressPosition}%,
                #f59e0b ${distressPosition + 2}%, 
                #f59e0b ${safePosition - 2}%, 
                #22c55e ${safePosition}%,
                #16a34a 100%
              )`
                        }}
                    />

                    {/* Glossy overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />

                    {/* Threshold Markers */}
                    <motion.div
                        className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-lg"
                        style={{ left: `${distressPosition}%` }}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                    />
                    <motion.div
                        className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-lg"
                        style={{ left: `${safePosition}%` }}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                    />

                    {/* Predicted score indicator ON the bar */}
                    <motion.div
                        className="absolute top-1/2 -translate-y-1/2 z-20"
                        style={{ left: `${predictedPosition}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={isAnimated ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.6, duration: 0.5, type: "spring" }}
                    >
                        {/* Glow effect */}
                        <motion.div
                            className="absolute w-8 h-8 rounded-full blur-md -left-1.5 -top-1.5"
                            style={{ backgroundColor: predictedZoneInfo.color }}
                            animate={{
                                opacity: [0.4, 0.7, 0.4],
                                scale: [1, 1.3, 1]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 2,
                                ease: "easeInOut"
                            }}
                        />
                        <div
                            className="relative w-5 h-5 rounded-full border-2 border-white shadow-xl flex items-center justify-center"
                            style={{
                                backgroundColor: predictedZoneInfo.color,
                                boxShadow: `0 0 15px ${predictedZoneInfo.color}80`
                            }}
                        >
                            <div className="w-2 h-2 rounded-full bg-white/50" />
                        </div>
                    </motion.div>
                </div>

                {/* Threshold Labels - positioned below gauge */}
                <div className="relative h-6 mt-1">
                    <motion.div
                        className="absolute flex flex-col items-center"
                        style={{ left: `${distressPosition}%`, transform: 'translateX(-50%)' }}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                    >
                        <span className="font-bold text-sm text-amber-500">1.81</span>
                    </motion.div>
                    <motion.div
                        className="absolute flex flex-col items-center"
                        style={{ left: `${safePosition}%`, transform: 'translateX(-50%)' }}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                    >
                        <span className="font-bold text-sm text-emerald-500">2.99</span>
                    </motion.div>
                </div>

                {/* Predicted Score Label - BELOW the gauge */}
                <motion.div
                    className="relative mt-2"
                    style={{ marginLeft: `${predictedPosition}%`, transform: 'translateX(-50%)', width: 'fit-content' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isAnimated ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.8, duration: 0.4 }}
                >
                    <div className="w-0.5 h-4 bg-gradient-to-b from-transparent to-current mx-auto" style={{ color: `${predictedZoneInfo.color}60` }} />
                    <div
                        className="px-4 py-2 rounded-xl backdrop-blur-sm border shadow-lg text-center"
                        style={{
                            backgroundColor: `${predictedZoneInfo.color}15`,
                            borderColor: `${predictedZoneInfo.color}40`
                        }}
                    >
                        <div className="flex items-center justify-center gap-1.5">
                            <predictedZoneInfo.icon className={`w-4 h-4 ${predictedZoneInfo.textColor}`} />
                            <span className={`text-lg font-bold ${predictedZoneInfo.textColor}`}>
                                {predictedScore.toFixed(4)}
                            </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                            Predicted Z-Score
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Zone Status Card */}
            <motion.div
                className="flex items-center justify-center gap-3 p-3 rounded-xl backdrop-blur-sm"
                style={{
                    backgroundColor: `${predictedZoneInfo.color}10`,
                    border: `1px solid ${predictedZoneInfo.color}30`
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
            >
                <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${predictedZoneInfo.color}20` }}
                >
                    <predictedZoneInfo.icon
                        className="w-5 h-5"
                        style={{ color: predictedZoneInfo.color }}
                    />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`font-semibold ${predictedZoneInfo.textColor}`}>
                            {predictedZoneInfo.zone} Zone
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                            {predictedZoneInfo.description}
                        </span>
                    </div>
                    {showBothScores && currentScore !== predictedScore && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {predictedScore > currentScore ? (
                                <span className="text-emerald-400">
                                    ↑ Moving towards {predictedScore > SAFE_THRESHOLD ? 'safety' : 'improvement'}
                                </span>
                            ) : (
                                <span className="text-red-400">
                                    ↓ Declining {predictedScore < DISTRESS_THRESHOLD ? 'into distress' : 'trajectory'}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
