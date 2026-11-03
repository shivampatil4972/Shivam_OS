import HomeApp from "@/apps/home/HomeApp";
import { OSRoot } from "@/os/OSRoot";

export default function Page() {
  return <OSRoot intent={{ type: "desktop" }} initialContent={<HomeApp />} />;
}
