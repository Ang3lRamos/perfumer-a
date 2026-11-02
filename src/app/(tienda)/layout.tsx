import { MarcoTienda } from "@/features/tienda/Marco";

export default function LayoutTienda({ children }: LayoutProps<"/">) {
  return <MarcoTienda>{children}</MarcoTienda>;
}
