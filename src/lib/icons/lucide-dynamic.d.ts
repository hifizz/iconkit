declare module "lucide-react/dist/esm/dynamicIconImports.mjs" {
  type IconNode = [tag: string, attrs: Record<string, string | number>][]
  const dynamicIconImports: Record<
    string,
    () => Promise<{ default: unknown; __iconNode: IconNode }>
  >
  export default dynamicIconImports
}
