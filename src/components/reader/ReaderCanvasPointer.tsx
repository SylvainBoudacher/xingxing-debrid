import { Pointer } from "@/components/ui/pointer";

interface ReaderCanvasPointerProps {
  /** L'image deborde : le glisser est possible, la main remplace la fleche. */
  pannable: boolean;
  grabbing: boolean;
}

/**
 * Curseur custom de la zone de lecture. Il reprend la forme du curseur systeme
 * pour que le passage vers les curseurs des zones de tourne reste discret.
 */
export function ReaderCanvasPointer({ pannable, grabbing }: ReaderCanvasPointerProps) {
  if (!pannable) {
    return (
      <Pointer centered={false}>
        <svg viewBox="0 0 16 16" className="h-5 w-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          <path
            d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"
            fill="#fff"
            stroke="#18181b"
            strokeWidth="1"
          />
        </svg>
      </Pointer>
    );
  }

  return (
    <Pointer>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
      >
        {grabbing ? (
          <>
            <path d="M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2V7a2 2 0 1 0-4 0v1a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
            <path d="M6 10a2 2 0 1 0-4 0c0 3.5 1.5 5.5 3 7l2 2c1 1 2 1.5 3.5 1.5h2A6.5 6.5 0 0 0 19 14v-2" />
          </>
        ) : (
          <>
            <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
            <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </>
        )}
      </svg>
    </Pointer>
  );
}
