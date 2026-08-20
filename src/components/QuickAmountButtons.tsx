interface Props {
  amounts: number[]
  onAdd: (amount: number) => void
  disabled?: boolean
}

export default function QuickAmountButtons({ amounts, onAdd, disabled }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {amounts.map((a) => (
        <button
          key={a}
          type="button"
          disabled={disabled}
          onClick={() => onAdd(a)}
          className="btn-primary h-14 text-lg shadow-sm active:bg-primary-600"
        >
          +{a}ml
        </button>
      ))}
    </div>
  )
}
