import fs from 'node:fs';

// The catalogue is newest first. Playlist creation dates are not supplied by YouTube.
// Preserve each playlist's internal teaching order; rank courses by oldest lecture.
export function orderCourses(courses) {
  const catalogue = JSON.parse(fs.readFileSync('channel-catalog.json', 'utf8')).videos;
  const rank = new Map(catalogue.map((video, index) => [video.id, index]));
  const config = JSON.parse(fs.readFileSync('content/course-order.json', 'utf8'));
  const result = courses.filter(course => course.id !== config.traumaCourse.id);
  result.push(structuredClone(config.traumaCourse));
  const traumaIds = new Set(config.traumaCourse.lectureIds);
  for (const course of result) {
    if (course.id === 'additional-lectures') course.lectureIds = course.lectureIds.filter(id => !traumaIds.has(id));
  }
  const oldest = course => Math.max(-1, ...course.lectureIds.map(id => rank.get(id) ?? -1));
  const specialtyRank = category => {
    const index = config.specialties.indexOf(category);
    return index < 0 ? config.specialties.length : index;
  };
  return result.filter(course => course.lectureIds.length).sort((a, b) => {
    const category = specialtyRank(a.category) - specialtyRank(b.category);
    if (category) return category;
    if (a.category === 'Pharmacology' && b.category === 'Pharmacology') {
      const position = course => {
        if (course.id === 'PLllTTKSgGCnlPzFFTYPaRTtObpOagHk--') return 0;
        if (/^therapy\s+for\b/i.test(course.title)) return 1;
        if (course.id === 'PLllTTKSgGCnkX3-1pudkLqmRD_TnwuF0Y') return 2;
        if (course.id === 'PLllTTKSgGCnnUIJfXWRdaMiM7yMNqFnkX') return 3;
        if (course.id === 'PLllTTKSgGCnk8HzbFnfDFn1iybmA7fshv') return 4;
        return 5;
      };
      const explicit = position(a) - position(b);
      if (explicit) return explicit;
    }
    if (a.category === 'Orthopedics' && b.category === 'Orthopedics') {
      const position = course => {
        const index = config.orthopedics.indexOf(course.id);
        return index < 0 ? config.orthopedics.length : index;
      };
      const explicit = position(a) - position(b);
      if (explicit) return explicit;
    }
    return oldest(b) - oldest(a) || a.title.localeCompare(b.title);
  });
}
