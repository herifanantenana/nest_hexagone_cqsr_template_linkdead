import slugify from "slugify";
import uniqueSlug from "unique-slug";

slugify.extend({
	a: "4",
	e: "3",
	i: "1",
	o: "0",
	s: "5",
	t: "7",
	g: "9",
	b: "8",
});

export function generateSlug(text: string): string {
	const slug = slugify(text, {
		lower: true,
		strict: true,
		trim: true,
	});
	return `${slug}-${uniqueSlug()}`;
}
