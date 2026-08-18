interface AllocationBarProps {
    percentage: number
    colorClass: string
    label: string
}

export function AllocationBar({ percentage, colorClass, label }: AllocationBarProps) {
    const isLarge = percentage > 50
    const isTiny = percentage < 10

    const barBaseClasses = `border-4 border-primary transition-all duration-500 flex items-center justify-center relative overflow-hidden ${colorClass}`

    const renderInnerContent = () => {
        if (isLarge) {
            return (
                <div className="flex items-center justify-between w-full px-4 gap-2">
                    <span className="font-black text-xs text-left leading-tight">{label}</span>
                    <span className="font-black text-lg">{percentage}%</span>
                </div>
            )
        } else if (!isTiny) {
            return <span className="font-black text-lg px-2">{percentage}%</span>
        }
        return null
    }

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
