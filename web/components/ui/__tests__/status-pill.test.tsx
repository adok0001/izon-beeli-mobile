import { render, screen } from "@testing-library/react";
import { StatusPill } from "../status-pill";
import { STATUS_LABEL } from "@/lib/content-workflow";

describe("StatusPill", () => {
  it("renders the label for a given status", () => {
    render(<StatusPill status="published" />);
    expect(screen.getByText(STATUS_LABEL.published)).toBeInTheDocument();
  });

  it("renders nothing when status is undefined", () => {
    const { container } = render(<StatusPill status={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
