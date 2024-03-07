import React, { useState, useEffect } from 'react';

const TextFormatter = () => {
  const [formattedText, setFormattedText] = useState([]);
  const [econdFormattedText, setSecondFormattedText] = useState([]);
  const [text, setText] = useState('');


useEffect(() => {
  // Define the patterns
  const patterns = [
    { regex: /```([^`]+)```/g, format: 'multiline_code' },
    { regex: /`([^`]+)`/g, format: 'code' },
    { regex: /(\[[^\]]+\]\(http[^)]+\))/, format: 'a' },
    { regex: /^\s*> ###\s*(.+)/, format: 'blockquote_h3' },
    { regex: /^\s*> ##\s*(.+)/, format: 'blockquote_h2' },
    { regex: /^\s*> #\s*(.+)/, format: 'blockquote_h1' },
    { regex: /^\s*>\s*(.+)/, format: 'blockquote' },
    { regex: /^###\s*(.+)/, format: 'h3' },
    { regex: /^##\s*(.+)/, format: 'h2' },
    { regex: /^#\s*(.+)/, format: 'h1' },
    { regex: /\*\*\*\s*([^*]+?)\s*\*\*\*/g, format: 'bi' },
    { regex: /\*\*(.*?)\*\*/, format: 'b' },
    { regex: /^\s{2,}\*\s(.+)/, format: 'sublist'},
    { regex: /^\s{2,}-\s(.+)/, format: 'sublist'},
    { regex: /^\s*-\s(.+)/, format: 'li'},
    { regex: /^\s*\*\s(.+)/, format: 'li'},
    { regex: /\*([^*\s]+)\*/g, format: 'i' },
    { regex: /~~(.*?)~~/g, format: 'del' },
    { regex: /__(.*?)__/g, format: 'u' },
  ];
  // Initialize the array with the original text
  let parts = [{ message: text, formats: [], line: 1 }];
  let lineNumber = 1;

  // Apply the multiline code formatting first
  parts = applyFormat(parts, patterns.find(pattern => pattern.format === 'multiline_code'));

  // Then split the text by newline characters
  parts = parts.flatMap(part => {
    if (part.formats.includes('multiline_code')) {
      // Don't split multiline code
      return [part];
    } else {
      // Split other text by newline characters
      return part.message.split('\n').map((line, index) => {
        if (index > 0) {
          lineNumber++;
        }
        return { message: line, formats: [], line: lineNumber };
      });
    }
  });
  // Apply the other formats
  patterns.filter(pattern => pattern.format !== 'multiline_code').forEach(pattern => {
    parts = applyFormat(parts, pattern);
  });

  function applyFormat(parts, pattern) {
    let newParts = [];
    parts.forEach(part => {
      if (typeof part.message === 'string') {
        let splitParts = part.message.split(pattern.regex);
        splitParts.forEach((splitPart, index) => {
        if (index % 2 === 0) {
          // This part does not match the pattern
          newParts.push({ message: splitPart, formats: part.formats, line: part.line });
        } else {
          // This part matches the pattern
          // If the format is 'a', keep the link text and URL together in the same part
          if (pattern.format === 'a') {
            const linkText = splitPart.match(/\[([^\]]+)\]/)[1];
            const linkUrl = splitPart.match(/\((http[^)]+)\)/)[1];
            newParts.push({ message: { text: linkText, url: linkUrl }, formats: [...part.formats, pattern.format], line: part.line });          
          } else {
            newParts.push({ message: splitPart, formats: [...part.formats, pattern.format], line: part.line });
          }
        }
      });
    } else {
      // If part.message is not a string, just push the part to newParts
      newParts.push(part);
    }
    });

    return newParts;
  }
  
  console.log(parts);
  setFormattedText(parts);
}, [text]);

return (
<div>
<textarea className='bg-black' value={text} onChange={(e) => setText(e.target.value)} />

    <div className='w-96'>
    {formattedText.map((part, index) => {
      let formattedMessage = part.message;
      part.formats.forEach(format => {
        switch (format) {
          case 'b':
            formattedMessage = <b>{formattedMessage}</b>;
            break;
          case 'i':
            formattedMessage = <i>{formattedMessage}</i>;
            break;
          case 'u':
            formattedMessage = <u>{formattedMessage}</u>;
            break;
          case 'del':
            formattedMessage = <del>{formattedMessage}</del>;
            break;
          case 'bi':
            formattedMessage = <b><i>{formattedMessage}</i></b>;
            break;
          case 'code':
            formattedMessage = <code>{formattedMessage}</code>;
            break;
          case 'multiline_code':
            formattedMessage = formattedMessage.split('\n').map((line, i) => <code key={i}>{line}<br /></code>);
            break;
          case 'h1':
            formattedMessage = <h1><b>{formattedMessage}</b></h1>;
            break;
          case 'h2':
            formattedMessage = <h2><b>{formattedMessage}</b></h2>;
            break;
          case 'h3':
            formattedMessage = <h3><b>{formattedMessage}</b></h3>;
            break;
            case "a":
              formattedMessage = <a href={part.message.url}>{part.message.text}</a>;
              break;
          case 'blockquote':
            formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4">{formattedMessage}</blockquote>;
            break;
           case 'blockquote_h1':
            formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4"><h1>{formattedMessage}</h1></blockquote>;
            break;
          case 'blockquote_h2':
            formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4"><h2>{formattedMessage}</h2></blockquote>;
            break;
          case 'li':
            formattedMessage = <li>{formattedMessage}</li>;
            break;
            case "sublist":
              const previousLine = formattedText.filter(part => part.line === (formattedText[index].line - 1));
              const previousLineHasListItem = previousLine.some(part => part.formats.includes('li'));
              const listStyle = previousLineHasListItem ? 'list-circle ml-6' : 'list-disc';
              formattedMessage = <li className={`${listStyle} list-inside`}>{formattedMessage}</li>;
              break;
          case 'blockquote_h3':
            formattedMessage = <blockquote className="border-l-4 border-gray-300 pl-4"><h3>{formattedMessage}</h3></blockquote>;
            break;
            default:
            break;
        }
      });
      const lineBreak = index > 0 && formattedText[index].line !== formattedText[index - 1].line ? <br /> : null;

      return (
        <React.Fragment key={index}>
          {lineBreak}
          <span>{formattedMessage}</span>
        </React.Fragment>
      )    })}
    
  </div>
  </div>
);
};

export default TextFormatter;

