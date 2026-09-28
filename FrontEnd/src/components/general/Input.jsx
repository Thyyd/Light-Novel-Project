function Input({ label, type, className, id, value, setValue, inputAttributes }) {

  function handleInput(event) {
    setValue(event.target.value);
  }

  return (
    <div className={`input-container flex flex-col gap-2 ${className ?? ''}`}>
      <label className="label text-[1rem] font-body font-semibold text-black" htmlFor={id}>{label}</label>
      <input {...inputAttributes}
        type={type}
        className="input w-full h-12.5 bg-background border border-[#999999] rounded-xl focus:border-[#777777]
          py-3 px-6 font-body font-normal text-[1rem] text-[#555555]"
        id={id}
        value={value}
        onChange={handleInput}
      />
    </div>
  )
}

export default Input;
