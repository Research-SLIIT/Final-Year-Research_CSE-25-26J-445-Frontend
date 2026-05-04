import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CompanySymbolSearch } from "@/components/company-symbol-search";

// cmdk calls scrollIntoView which jsdom does not support — stub it globally
Element.prototype.scrollIntoView = vi.fn();

// Mock the shadcn Command components to avoid cmdk internals in jsdom
vi.mock("@/components/ui/command", () => ({
  Command: ({ children }: any) => <div data-testid="command">{children}</div>,
  CommandList: ({ children }: any) => <ul>{children}</ul>,
  CommandEmpty: ({ children }: any) => <li data-testid="command-empty">{children}</li>,
  CommandGroup: ({ heading, children }: any) => (
    <li>
      <span data-testid="group-heading">{heading}</span>
      <ul>{children}</ul>
    </li>
  ),
  CommandItem: ({ children, onSelect, onMouseDown }: any) => (
    <li role="option" onMouseDown={onMouseDown} onClick={onSelect}>
      {children}
    </li>
  ),
}));

const defaultProps = {
  value: "",
  onChange: vi.fn(),
  onSelect: vi.fn(),
  onEnter: vi.fn(),
};

const getInput = () =>
  screen.getByPlaceholderText("Search by company name or symbol...");

beforeEach(() => {
  defaultProps.onChange.mockReset();
  defaultProps.onSelect.mockReset();
  defaultProps.onEnter.mockReset();
});

describe("CompanySymbolSearch", () => {
  it("renders the input field", () => {
    render(<CompanySymbolSearch {...defaultProps} />);
    expect(getInput()).toBeInTheDocument();
  });

  it("shows default placeholder text", () => {
    render(<CompanySymbolSearch {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("Search by company name or symbol...")
    ).toBeInTheDocument();
  });

  it("shows custom placeholder when provided", () => {
    render(<CompanySymbolSearch {...defaultProps} placeholder="Search stocks..." />);
    expect(screen.getByPlaceholderText("Search stocks...")).toBeInTheDocument();
  });

  it("is disabled when disabled=true", () => {
    render(<CompanySymbolSearch {...defaultProps} disabled={true} />);
    expect(getInput()).toBeDisabled();
  });

  it("shows Popular Companies group heading on focus", () => {
    render(<CompanySymbolSearch {...defaultProps} value="" />);
    fireEvent.focus(getInput());
    expect(screen.getByText("Popular Companies")).toBeInTheDocument();
  });

  it("calls onChange when user types", () => {
    render(<CompanySymbolSearch {...defaultProps} />);
    fireEvent.change(getInput(), { target: { value: "AAF" } });
    expect(defaultProps.onChange).toHaveBeenCalledWith("AAF");
  });

  it("shows Search Results heading when value is non-empty", () => {
    render(<CompanySymbolSearch {...defaultProps} value="Abans" />);
    fireEvent.focus(getInput());
    expect(screen.getByText("Search Results")).toBeInTheDocument();
  });

  it("calls onEnter when Enter key is pressed", () => {
    render(<CompanySymbolSearch {...defaultProps} value="AAF" />);
    fireEvent.keyDown(getInput(), { key: "Enter" });
    expect(defaultProps.onEnter).toHaveBeenCalledOnce();
  });

  it("closes dropdown on Escape key", async () => {
    render(<CompanySymbolSearch {...defaultProps} value="" />);
    fireEvent.focus(getInput());
    expect(screen.getByText("Popular Companies")).toBeInTheDocument();
    fireEvent.keyDown(getInput(), { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByText("Popular Companies")).not.toBeInTheDocument();
    });
  });

  it("shows 'No companies found' when query matches nothing", () => {
    render(<CompanySymbolSearch {...defaultProps} value="xyzxyzxyz123" />);
    fireEvent.focus(getInput());
    expect(screen.getByTestId("command-empty")).toBeInTheDocument();
    expect(screen.getByText("No companies found.")).toBeInTheDocument();
  });

  it("shows at most 10 results for a broad search query", () => {
    render(<CompanySymbolSearch {...defaultProps} value="a" />);
    fireEvent.focus(getInput());
    const results = screen.getAllByRole("option");
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it("calls onChange with company symbol when a result item is clicked", () => {
    render(<CompanySymbolSearch {...defaultProps} value="Abans" />);
    fireEvent.focus(getInput());
    const firstOption = screen.getAllByRole("option")[0];
    fireEvent.click(firstOption);
    expect(defaultProps.onChange).toHaveBeenCalled();
  });
});
