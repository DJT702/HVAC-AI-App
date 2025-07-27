import React from 'react'

const MarkdownRenderer = ({ content }) => {
  if (!content) return null

  // Enhanced markdown parser for ChatGPT-like formatting
  const parseMarkdown = (text) => {
    const lines = text.split('\n')
    const elements = []
    let currentList = null
    let currentListItems = []
    let listType = 'ul' // 'ul' for bullet lists, 'ol' for numbered lists

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      if (!trimmedLine) {
        // Empty line - close any open lists and add spacing
        if (currentList) {
          const ListComponent = listType === 'ol' ? 'ol' : 'ul'
          elements.push(
            React.createElement(
              ListComponent,
              {
                key: `list-${elements.length}`,
                className: listType === 'ol' 
                  ? "list-decimal list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200" 
                  : "list-disc list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200"
              },
              currentListItems
            )
          )
          currentList = null
          currentListItems = []
        }
        elements.push(<div key={`space-${index}`} className="h-4"></div>)
        return
      }

      // Headers - ChatGPT style
      if (trimmedLine.startsWith('## ')) {
        if (currentList) {
          const ListComponent = listType === 'ol' ? 'ol' : 'ul'
          elements.push(
            React.createElement(
              ListComponent,
              {
                key: `list-${elements.length}`,
                className: listType === 'ol' 
                  ? "list-decimal list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200" 
                  : "list-disc list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200"
              },
              currentListItems
            )
          )
          currentList = null
          currentListItems = []
        }
        const headerText = trimmedLine.substring(3).trim()
        elements.push(
          <h2 key={`h2-${index}`} className="text-2xl font-bold text-slate-900 dark:text-white mb-4 mt-8 flex items-center">
            {parseInlineFormatting(headerText)}
          </h2>
        )
      }
      else if (trimmedLine.startsWith('### ')) {
        if (currentList) {
          const ListComponent = listType === 'ol' ? 'ol' : 'ul'
          elements.push(
            React.createElement(
              ListComponent,
              {
                key: `list-${elements.length}`,
                className: listType === 'ol' 
                  ? "list-decimal list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200" 
                  : "list-disc list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200"
              },
              currentListItems
            )
          )
          currentList = null
          currentListItems = []
        }
        const headerText = trimmedLine.substring(4).trim()
        elements.push(
          <h3 key={`h3-${index}`} className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 mt-6">
            {parseInlineFormatting(headerText)}
          </h3>
        )
      }
      // Bullet list items
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        const listText = trimmedLine.substring(2).trim()
        if (listType !== 'ul') {
          // Close previous list if different type
          if (currentList) {
            elements.push(
              <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200">
                {currentListItems}
              </ol>
            )
            currentListItems = []
          }
          listType = 'ul'
        }
        currentList = true
        currentListItems.push(
          <li key={`li-${index}`} className="text-slate-800 dark:text-slate-200 leading-relaxed">
            {parseInlineFormatting(listText)}
          </li>
        )
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(trimmedLine)) {
        const listText = trimmedLine.replace(/^\d+\.\s/, '').trim()
        if (listType !== 'ol') {
          // Close previous list if different type
          if (currentList) {
            elements.push(
              <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200">
                {currentListItems}
              </ul>
            )
            currentListItems = []
          }
          listType = 'ol'
        }
        currentList = true
        currentListItems.push(
          <li key={`li-${index}`} className="text-slate-800 dark:text-slate-200 leading-relaxed">
            {parseInlineFormatting(listText)}
          </li>
        )
      }
      // Regular paragraphs
      else {
        if (currentList) {
          const ListComponent = listType === 'ol' ? 'ol' : 'ul'
          elements.push(
            React.createElement(
              ListComponent,
              {
                key: `list-${elements.length}`,
                className: listType === 'ol' 
                  ? "list-decimal list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200" 
                  : "list-disc list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200"
              },
              currentListItems
            )
          )
          currentList = null
          currentListItems = []
        }
        elements.push(
          <p key={`p-${index}`} className="text-slate-800 dark:text-slate-200 mb-4 leading-relaxed text-base">
            {parseInlineFormatting(trimmedLine)}
          </p>
        )
      }
    })

    // Close any remaining list
    if (currentList) {
      const ListComponent = listType === 'ol' ? 'ol' : 'ul'
      elements.push(
        React.createElement(
          ListComponent,
          {
            key: `list-final`,
            className: listType === 'ol' 
              ? "list-decimal list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200" 
              : "list-disc list-inside space-y-3 mb-6 ml-4 text-slate-800 dark:text-slate-200"
          },
          currentListItems
        )
      )
    }

    return elements
  }

  // Enhanced inline formatting parser
  const parseInlineFormatting = (text) => {
    const parts = []
    let currentIndex = 0
    
    // Patterns for inline formatting
    const patterns = [
      { 
        regex: /\*\*(.*?)\*\*/g, 
        component: (match, content) => (
          <strong key={`bold-${currentIndex++}`} className="font-bold text-slate-900 dark:text-white">
            {content}
          </strong>
        ) 
      },
      { 
        regex: /\*(.*?)\*/g, 
        component: (match, content) => (
          <em key={`italic-${currentIndex++}`} className="italic">
            {content}
          </em>
        ) 
      },
      { 
        regex: /`(.*?)`/g, 
        component: (match, content) => (
          <code key={`code-${currentIndex++}`} className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-sm font-mono text-slate-800 dark:text-slate-200">
            {content}
          </code>
        ) 
      },
    ]

    let processedText = text
    const replacements = []

    patterns.forEach(({ regex, component }) => {
      let match
      while ((match = regex.exec(text)) !== null) {
        replacements.push({
          start: match.index,
          end: match.index + match[0].length,
          component: component(match[0], match[1]),
          original: match[0]
        })
      }
    })

    // Sort replacements by position
    replacements.sort((a, b) => a.start - b.start)

    // Build the result with replacements
    let lastIndex = 0
    const result = []

    replacements.forEach((replacement, index) => {
      // Add text before this replacement
      if (replacement.start > lastIndex) {
        result.push(text.substring(lastIndex, replacement.start))
      }
      
      // Add the replacement component
      result.push(replacement.component)
      lastIndex = replacement.end
    })

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex))
    }

    return result.length > 0 ? result : text
  }

  return (
    <div className="max-w-none">
      <div className="space-y-2">
        {parseMarkdown(content)}
      </div>
    </div>
  )
}

export default MarkdownRenderer

