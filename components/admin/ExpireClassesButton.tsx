import { autoExpireClassesAction } from "@/actions/class.actions";

export default function ExpireClassesButton({ count }: { count: number }) {
  const disabled = !count || count <= 0;

  return (
    <form
      action={async () => {
        "use server";
        if (disabled) return;
        await autoExpireClassesAction();
      }}
    >
      <button
        type="submit"
        disabled={disabled}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
          disabled
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-violet-600 text-white hover:bg-violet-700 cursor-pointer"
        }`}
        title={disabled ? "No finished classes to expire" : undefined}
      >
        Expire Finished Classes{count > 0 ? ` (${count})` : ""}
      </button>
    </form>
  );
}
