let stairs = [];

export async function findStairs(search) {
  if (stairs.length === 0) {
    const [gfResponse, ffResponse] = await Promise.all([
      fetch("/data/stairs.geojson"),
      fetch("/data/stairs_ff.geojson"),
    ]);

    const gfData = await gfResponse.json();
    const ffData = await ffResponse.json();

    stairs = [
      ...gfData.features,
      ...ffData.features,
    ];
  }

  const query = search.trim().toUpperCase();

  return stairs.filter((stair) => {
    const p = stair.properties;

    return (
      p.id.toUpperCase() === query ||
      p.name.toUpperCase().includes(query)
    );
  });
}