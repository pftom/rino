import mdast from "mdast"
import fromMarkdown from "mdast-util-from-markdown"
import mdastStrikethrough from "mdast-util-gfm-strikethrough"
import micromarkStrikethrough from "micromark-extension-gfm-strikethrough"

import { InlineToken, RinoMarkName } from "./define"

function fixMarkNames(marks: RinoMarkName[]): RinoMarkName[] {
    if (marks.length <= 1) return marks
    if (marks.includes("mdMark")) return ["mdMark"]
    if (marks.includes("mdCodeText")) return ["mdCodeText"]
    if (marks.includes("mdText")) return marks.filter((x) => x !== "mdText")
    return marks
}

function flatText(mdastToken: mdast.Text, depth: number): InlineToken[] {
    return [
        {
            marks: ["mdText"],
            attrs: { depth, first: true, last: true },
            start: mdastToken.position.start.offset,
            end: mdastToken.position.end.offset,
            text: "",
        },
    ]
}

function flatStrong(mdastToken: mdast.Strong, depth: number): InlineToken[] {
    const inlineTokens: InlineToken[] = [
        {
            marks: ["mdMark"],
            attrs: { depth, first: true },
            start: mdastToken.position.start.offset,
            end: mdastToken.position.start.offset + 2,
            text: "",
        },
    ]
    for (const childMdastToken of mdastToken.children) {
        for (const inlineToken of flatPhrasingContent(childMdastToken, depth + 1)) {
            inlineToken.marks.push("mdStrong")
            inlineTokens.push(inlineToken)
        }
    }
    inlineTokens.push({
        marks: ["mdMark"],
        attrs: { depth, last: true },
        start: mdastToken.position.end.offset - 2,
        end: mdastToken.position.end.offset,
        text: "",
    })
    return inlineTokens
}

function flatEmphasis(mdastToken: mdast.Emphasis, depth: number): InlineToken[] {
    const inlineTokens: InlineToken[] = [
        {
            marks: ["mdMark"],
            attrs: { depth, first: true },
            start: mdastToken.position.start.offset,
            end: mdastToken.position.start.offset + 1,
            text: "",
        },
    ]
    for (const childMdastToken of mdastToken.children) {
        for (const inlineToken of flatPhrasingContent(childMdastToken, depth + 1)) {
            inlineToken.marks.push("mdEm")
            inlineTokens.push(inlineToken)
        }
    }
    inlineTokens.push({
        marks: ["mdMark"],
        attrs: { depth, last: true },
        start: mdastToken.position.end.offset - 1,
        end: mdastToken.position.end.offset,
        text: "",
    })
    return inlineTokens
}

function flatDelete(mdastToken: mdast.Delete, depth: number): InlineToken[] {
    const inlineTokens: InlineToken[] = [
        {
            marks: ["mdMark"],
            attrs: { depth, first: true },
            start: mdastToken.position.start.offset,
            end: mdastToken.position.start.offset + 2,
            text: "",
        },
    ]
    for (const childMdastToken of mdastToken.children) {
        for (const inlineToken of flatPhrasingContent(childMdastToken, depth + 1)) {
            inlineToken.marks.push("mdDel")
            inlineTokens.push(inlineToken)
        }
    }
    inlineTokens.push({
        marks: ["mdMark"],
        attrs: { depth, last: true },
        start: mdastToken.position.end.offset - 2,
        end: mdastToken.position.end.offset,
        text: "",
    })
    return inlineTokens
}

function flatInlineCode(mdastToken: mdast.InlineCode, depth: number): InlineToken[] {
    return [
        {
            marks: ["mdMark"],
            attrs: { depth, first: true },
            start: mdastToken.position.start.offset,
            end: mdastToken.position.start.offset + 1,
            text: "",
        },
        {
            marks: ["mdCodeText"],
            attrs: { depth },
            start: mdastToken.position.start.offset + 1,
            end: mdastToken.position.end.offset - 1,
            text: "",
        },
        {
            marks: ["mdMark"],
            attrs: { depth, last: true },
            start: mdastToken.position.end.offset - 1,
            end: mdastToken.position.end.offset,
            text: "",
        },
    ]
}

function flatImage(mdastToken: mdast.Image, depth: number): InlineToken[] {
    return [
        {
            marks: ["mdImgUri"],
            attrs: { depth, first: true, last: true, href: mdastToken.url },
            start: mdastToken.position.start.offset,
            end: mdastToken.position.end.offset,
            text: "",
        },
    ]
}

function flatLink(mdastToken: mdast.Link, depth: number): InlineToken[] {
    const inlineTokens: InlineToken[] = [
        // match "<" for autolinks or "[" for links
        {
            marks: ["mdMark"],
            attrs: { depth, first: true },
            start: mdastToken.position.start.offset,
            end: mdastToken.position.start.offset + 1,
            text: "",
        },
    ]
    for (const childMdastToken of mdastToken.children) {
        for (const inlineToken of flatPhrasingContent(childMdastToken, depth + 1)) {
            inlineToken.marks.push("mdLinkText")
            inlineToken.attrs.href = mdastToken.url
            inlineTokens.push(inlineToken)
        }
    }
    const childrenEndPos = inlineTokens[inlineTokens.length - 1].end
    const parentEndPos = mdastToken.position.end.offset

    if (childrenEndPos + 2 < parentEndPos) {
        inlineTokens.push(
            // match "](" for links
            {
                marks: ["mdMark"],
                attrs: { depth },
                start: childrenEndPos,
                end: childrenEndPos + 2,
                text: "",
            },
            // match the content between "(" and ")" for links
            {
                marks: ["mdLinkUri"], // TODO: it's not only uri
                attrs: { depth },
                start: childrenEndPos + 2,
                end: parentEndPos - 1,
                text: "",
            },
        )
    }

    // match ">" for autolinks or "]" for links
    inlineTokens.push({
        marks: ["mdMark"],
        attrs: { depth, last: true },
        start: parentEndPos - 1,
        end: parentEndPos,
        text: "",
    })
    return inlineTokens
}

// Make a tree structural mdast `PhrasingContent` object into a flat `InlineToken` array.
function flatPhrasingContent(mdastToken: mdast.PhrasingContent, depth: number): InlineToken[] {
    console.assert(depth >= 1)
    switch (mdastToken.type) {
        case "text":
            return flatText(mdastToken, depth)
        case "strong":
            return flatStrong(mdastToken, depth)
        case "emphasis":
            return flatEmphasis(mdastToken, depth)
        case "delete":
            return flatDelete(mdastToken, depth)
        case "inlineCode":
            return flatInlineCode(mdastToken, depth)
        case "html":
            return []
        case "break":
            return []
        case "image":
            return flatImage(mdastToken, depth)
        case "imageReference":
            return []
        case "footnote":
            return []
        case "footnoteReference":
            return []
        case "link":
            return flatLink(mdastToken, depth)
        case "linkReference":
            return []
        default:
            console.warn("unknow mdast token:", mdastToken)
            return []
    }
}

type PhrasingContentType = mdast.PhrasingContent["type"]

const phrasingContentTypes: Record<PhrasingContentType, true> = {
    delete: true,
    text: true,
    emphasis: true,
    strong: true,
    html: true,
    inlineCode: true,
    break: true,
    image: true,
    imageReference: true,
    footnote: true,
    footnoteReference: true,
    link: true,
    linkReference: true,
}

function parseInlineMarkdown(text: string): mdast.PhrasingContent[] {
    try {
        const disabledConstructs = [
            "blockQuote",
            "characterEscape",
            "characterReference",
            "codeFenced",
            "codeIndented",
            "definition",
            "headingAtx",
            "htmlFlow",
            "htmlText",
            "list",
            "thematicBreak",
        ]
        const root: mdast.Root = fromMarkdown(text, {
            extensions: [{ disable: { null: disabledConstructs } }, micromarkStrikethrough({ singleTilde: false })],
            mdastExtensions: [mdastStrikethrough.fromMarkdown],
        })
        if (root.children.length !== 1) {
            throw Error(`root.children has ${root.children.length} children`)
        }
        const paragraph = root.children[0]
        if (paragraph.type !== "paragraph") {
            throw Error(`unknow child type ${paragraph.type}`)
        }

        for (const child of paragraph.children) {
            if (!phrasingContentTypes[child.type]) {
                throw Error(`got unknow phrasingContent token: ${JSON.stringify(child)}`)
            }
        }
        return paragraph.children
    } catch (error) {
        console.warn(`failed to parse inline markdown text ${JSON.stringify(text)}: ${error}`)
    }
    return []
}

export function fromInlineMarkdown(text: string): InlineToken[] {
    const inlineTokens: InlineToken[] = []
    for (const phrasingContent of parseInlineMarkdown(text)) {
        for (const inlineToken of flatPhrasingContent(phrasingContent, 1)) {
            if (inlineToken.end - inlineToken.start === 0) {
                continue // Prosemirror doesn't allow empty text node
            }
            inlineToken.marks = fixMarkNames(inlineToken.marks)
            inlineToken.text = text.slice(inlineToken.start, inlineToken.end)
            inlineTokens.push(inlineToken)
        }
    }
    return inlineTokens
}
