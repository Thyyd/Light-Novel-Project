function Synopsis({ synopsis }) {
  return(
    <div className="synopsis flex flex-col gap-4 bg-white rounded-2xl shadow-md p-6 m-6 md:p-8 md:m-12">
      <h2 className="font-title font-bold text-2xl text-black">Synopsis</h2>
      <div className="flex flex-col gap-4 font-synopsis text-black text-sm md:text-base leading-relaxed">
        {synopsis
          .split('\n')
          .filter((paragraphe) => paragraphe.trim() !== '')
          .map((paragraphe, index) => (
            <p key={index}>{paragraphe}</p>
          ))}
      </div>
    </div>
  );
}

export default Synopsis;
