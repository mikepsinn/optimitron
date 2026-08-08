
interface AllocationBarProps {
    percentage: number
    colorClass: string
    label: string
}

export function AllocationBar({ percentage, colorClass, label }: AllocationBarProps) {
    const isLarge = percentage > 50
    const isTiny = percentage < 10

    // Base bar styles
    const barBaseClasses = `border-2 border-primary transition-all duration-500 flex items-center justify-center relative overflow-hidden ${colorClass}`

    // Render content inside the bar
    const renderInnerContent = () => {
        if (isLarge) {
            // Split layout: Label Left, Percentage Right
            return (
                <div className="flex items-center justify-between w-full px-4 gap-2">
                    <span className="font-black text-xs text-left leading-tight">{label}</span>
                    <span className="font-black text-lg">{percentage}%</span>
                </div>
            )
        } else if (!isTiny) {
            // 15 <= p <= 50: % inside
            return <span className="font-black text-lg px-2">{percentage}%</span>
        }
        // < 15: Empty inside
        return null
    }

    // Render label (and percentage if tiny) outside the bar
    const renderOutsideLabel = () => {
        if (isLarge) {
            return null
        }

        if (isTiny) {
            return (
                <div className="flex items-center gap-2">
                    <span className="font-black text-lg">{percentage}%</span>
                    <div className="text-xs font-bold leading-tight">
                        {label}
                    </div>
                </div>
            )
        }

        // 15 <= p <= 50
        return (
            <div className="text-xs font-bold leading-tight">
                {label}
            </div>
        )
    }

    return (
        <div className="mb-1 flex items-center gap-3">
            <div
                className={barBaseClasses}
                style={{
                    width: `${percentage}%`,
                    height: '50px',
                    minWidth: isTiny ? '0' : '40px'
                }}
            >
                {renderInnerContent()}
            </div>
            {renderOutsideLabel()}
        </div>
    )
}
