const DottedDivider = ({ className = "" }) => {
  return (
    <div
      className={`h-[1px] w-full my-4 lg:my-9 ${className}`}
      style={{
        backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
        backgroundSize: "30px 1px",
        backgroundRepeat: "repeat-x",
      }}
    />
  );
};

export default DottedDivider