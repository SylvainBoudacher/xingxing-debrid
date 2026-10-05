import { describe, it, expect } from "vitest";
import { diagnoseAllDebrid, diagnoseC411 } from "./serviceDiagnosis";

describe("diagnoseC411", () => {
  it("blames the user's connection first", () => {
    expect(diagnoseC411({ internet: false, statusPage: "outage", api: "error" }).cause).toBe(
      "internet",
    );
  });

  it("is healthy when the API answers, even with a refused key", () => {
    expect(diagnoseC411({ internet: true, statusPage: "outage", api: "ok" }).ok).toBe(true);
    expect(diagnoseC411({ internet: true, statusPage: "ok", api: "auth" }).ok).toBe(true);
  });

  it("reports an outage confirmed by the status page", () => {
    expect(diagnoseC411({ internet: true, statusPage: "outage", api: "unreachable" }).cause).toBe(
      "outage",
    );
  });

  it("reports a DNS block", () => {
    expect(diagnoseC411({ internet: true, statusPage: "unreachable", api: "dns" }).cause).toBe(
      "blocked",
    );
  });

  it("assumes an outage when C411 and its status page are both unreachable", () => {
    expect(
      diagnoseC411({ internet: true, statusPage: "unreachable", api: "unreachable" }).cause,
    ).toBe("outage");
  });

  it("reports a block when the status page is green but C411 is unreachable", () => {
    expect(diagnoseC411({ internet: true, statusPage: "ok", api: "unreachable" }).cause).toBe(
      "blocked",
    );
  });

  it("reports API errors when the site is up", () => {
    expect(diagnoseC411({ internet: true, statusPage: "ok", api: "error" }).cause).toBe("api");
  });

  it("trusts the status page when no key is configured", () => {
    expect(diagnoseC411({ internet: true, statusPage: "ok", api: "nokey" }).ok).toBe(true);
  });
});

describe("diagnoseAllDebrid", () => {
  it("blames the user's connection first", () => {
    expect(diagnoseAllDebrid({ internet: false, ping: false }).cause).toBe("internet");
  });

  it("is healthy when the ping answers", () => {
    expect(diagnoseAllDebrid({ internet: true, ping: true }).ok).toBe(true);
  });

  it("reports an outage when the ping fails", () => {
    expect(diagnoseAllDebrid({ internet: true, ping: false }).cause).toBe("outage");
  });
});
