import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TagList } from "@/components/analysis/TagList";

describe("TagList", () => {
  it("renders a span for each tag in the array", () => {
    render(<TagList tags={["profit", "growth", "dividend"]} />);
    expect(screen.getByText("profit")).toBeInTheDocument();
    expect(screen.getByText("growth")).toBeInTheDocument();
    expect(screen.getByText("dividend")).toBeInTheDocument();
  });

  it("trims whitespace from tag strings", () => {
    render(<TagList tags={["  profit  ", " growth "]} />);
    expect(screen.getByText("profit")).toBeInTheDocument();
    expect(screen.getByText("growth")).toBeInTheDocument();
  });

  it("renders empty container when tags is empty array", () => {
    const { container } = render(<TagList tags={[]} />);
    const tagList = container.querySelector(".tag-list");
    expect(tagList).toBeInTheDocument();
    expect(tagList?.children).toHaveLength(0);
  });

  it("each tag is rendered inside a .tag class element", () => {
    const { container } = render(<TagList tags={["alpha", "beta"]} />);
    const tags = container.querySelectorAll(".tag");
    expect(tags).toHaveLength(2);
  });

  it("tag text content matches trimmed input", () => {
    const { container } = render(<TagList tags={["  CSE  "] } />);
    const tag = container.querySelector(".tag");
    expect(tag?.textContent).toBe("CSE");
  });
});
