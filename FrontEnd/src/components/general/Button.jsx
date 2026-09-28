function Button({ label, className, onClick, type = 'button' }) {

  return (
    <button
      className={`button text-white bg-button-main font-body font-bold text-[1rem]
        px-2.5 py-2 rounded-xl hover:cursor-pointer ${className ?? ''}`}
      onClick={onClick}
      type={type}
    >
      {label}
    </button>
  )
}

export default Button;
