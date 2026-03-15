import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/analysis/StatusBadge";

describe("StatusBadge", () => {
  it('renders "Passed" text with green classes when passed=true', () => {
    const { container } = render(<StatusBadge passed={true} />);
    expect(screen.getByText(/Passed/)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-green-500/20");
  });

  it('renders "Failed" text with red classes when passed=false', () => {
    const { container } = render(<StatusBadge passed={false} />);
    expect(screen.getByText(/Failed/)).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-red-500/20");
  });
});
