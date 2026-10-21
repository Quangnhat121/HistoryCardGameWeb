export function ConnectionBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[100] bg-amber-400 px-4 py-2 text-center text-sm font-bold text-black shadow-lg">
      <span className="mr-2 inline-block h-2 w-2 animate-ping rounded-full bg-black" />
      Đang kết nối lại...
    </div>
  );
}
