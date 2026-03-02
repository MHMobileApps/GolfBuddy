export function normalizeCourse(raw: any) {
  return {
    course: {
      id: raw.id,
      name: raw.course_name,
      city: raw.city,
      country: raw.country,
      lat: raw.latitude,
      lng: raw.longitude
    },
    tees: (raw.tees ?? []).map((tee: any) => ({
      course_id: raw.id,
      tee_id: tee.id,
      tee_name: tee.tee_name,
      gender: tee.gender,
      slope: tee.slope_rating,
      rating: tee.course_rating,
      par_total: tee.par_total,
      yardage_total: tee.total_yards
    })),
    holes: (raw.tees ?? []).flatMap((tee: any) =>
      (tee.holes ?? []).map((hole: any) => ({
        course_id: raw.id,
        tee_id: tee.id,
        hole_number: hole.hole,
        par: hole.par,
        yardage: hole.yards,
        stroke_index: hole.handicap
      }))
    )
  };
}
