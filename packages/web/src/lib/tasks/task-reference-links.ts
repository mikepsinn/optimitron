export interface TaskReferenceLink {
  href: string;
  id: string;
  title: string;
}

interface MarkdownNode {
  children?: MarkdownNode[];
  type: string;
  url?: string;
  value?: string;
}

const TASK_ID_SOURCE = String.raw`\bc[a-z0-9]{24}\b`;
const PROTECTED_MARKDOWN_NODE_TYPES = new Set([
  "code",
  "definition",
  "image",
  "imageReference",
  "inlineCode",
  "link",
  "linkReference",
]);

function taskIdPattern() {
  return new RegExp(TASK_ID_SOURCE, "g");
}

export function extractTaskReferenceIds(markdown: string): string[] {
  return [...new Set(markdown.match(taskIdPattern()) ?? [])];
}

function linkTextNode(
  node: MarkdownNode,
  referenceById: ReadonlyMap<string, TaskReferenceLink>,
): MarkdownNode[] {
  const value = node.value ?? "";
  const replacements: MarkdownNode[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(taskIdPattern())) {
    const id = match[0];
    const index = match.index;
    const reference = referenceById.get(id);
    if (!reference) continue;

    if (index > lastIndex) {
      replacements.push({ type: "text", value: value.slice(lastIndex, index) });
    }
    replacements.push({
      type: "link",
      url: reference.href,
      children: [{ type: "text", value: reference.title }],
    });
    lastIndex = index + id.length;
  }

  if (lastIndex === 0) return [node];
  if (lastIndex < value.length) {
    replacements.push({ type: "text", value: value.slice(lastIndex) });
  }
  return replacements;
}

function linkTaskReferences(
  node: MarkdownNode,
  referenceById: ReadonlyMap<string, TaskReferenceLink>,
) {
  if (!node.children || PROTECTED_MARKDOWN_NODE_TYPES.has(node.type)) return;

  const children: MarkdownNode[] = [];
  for (const child of node.children) {
    if (child.type === "text") {
      children.push(...linkTextNode(child, referenceById));
      continue;
    }
    linkTaskReferences(child, referenceById);
    children.push(child);
  }
  node.children = children;
}

export function createTaskReferenceLinksPlugin(
  references: readonly TaskReferenceLink[],
) {
  const referenceById = new Map(
    references.map((reference) => [reference.id, reference]),
  );

  return function remarkTaskReferenceLinks() {
    return function transformTaskReferenceLinks(tree: MarkdownNode) {
      linkTaskReferences(tree, referenceById);
    };
  };
}
