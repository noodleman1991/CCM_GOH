import { describe, expect, it } from "vitest";
import { withoutContact } from "@/lib/people/without-contact";

describe("member records sent to a page", () => {
  it("never carry email or phone — whatever the member's own settings say", () => {
    const person = { id: "u2", firstName: "Amina", email: "amina@example.org", emailVerified: new Date(), phoneNumber: "+44 7700 900000", phoneVerified: new Date(), showEmail: true, showPhoneNumber: true, city: "Nairobi" };
    const safe = withoutContact(person);
    expect(safe).toEqual({ id: "u2", firstName: "Amina", showEmail: true, showPhoneNumber: true, city: "Nairobi" });
    expect(JSON.stringify(safe)).not.toMatch(/@|\+44/);
  });
});
