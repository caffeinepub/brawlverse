import { Button } from "@/components/ui/button";

interface Props {
  winner: string;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export default function WinScreen({ winner, onPlayAgain, onMainMenu }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ color: "#F2F6FF" }}
    >
      <div className="text-center max-w-lg">
        {/* Trophy */}
        <div
          className="text-9xl mb-6"
          style={{ filter: "drop-shadow(0 0 40px rgba(255,215,0,0.6))" }}
        >
          🏆
        </div>

        <div
          className="text-2xl font-bold mb-2 tracking-widest"
          style={{ color: "#B7C2D6", textTransform: "uppercase" }}
        >
          Winner
        </div>

        <div
          className="text-6xl font-black mb-4"
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #FF9A2E 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          data-ocid="win.winner_name"
        >
          {winner}
        </div>

        <p className="mb-10" style={{ color: "#7a8fa8" }}>
          Dominating the arena — another challenger falls!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onPlayAgain}
            size="lg"
            className="font-black tracking-wider px-10 py-4 h-auto"
            style={{
              background: "linear-gradient(135deg, #2D8CFF, #1a6fd8)",
              border: "none",
            }}
            data-ocid="win.play_again_button"
          >
            ⚔️ Play Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onMainMenu}
            className="font-bold tracking-wider px-10 py-4 h-auto"
            style={{
              borderColor: "#243249",
              color: "#B7C2D6",
              background: "transparent",
            }}
            data-ocid="win.main_menu_button"
          >
            🏠 Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
