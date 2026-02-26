"use client"

interface TagListProps {
  tags: string[]
}

export function TagList({ tags }: TagListProps) {
  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <span key={tag} className="tag">
          {tag.trim()}
        </span>
      ))}
    </div>
  )
}
