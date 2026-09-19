function Tag({ type, label, className = '' }) {

  return(
    <a
      className={`tag ${type ?? ''} ${className} font-title font-semibold px-2.5 py-1
        bg-blue-tag text-white text-[0.75rem] rounded-full`}
      href="#"
      onClick={(e) => e.preventDefault()}
    >
      {label}
    </a>
  )
}

export default Tag;
