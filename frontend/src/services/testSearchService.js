import { searchDestinations } from "./searchService";

async function testSearch() {
  console.log(
    "M2:",
    await searchDestinations("M2")
  );

  console.log(
    "Lab:",
    await searchDestinations("Lab")
  );

  console.log(
    "Faculty:",
    await searchDestinations("Faculty")
  );
}

testSearch();