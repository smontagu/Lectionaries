function CallGetText(citations, version) {
  const options = {method: 'GET', headers: {accept: 'application/json'}};
  const baseUrl = "https://www.sefaria.org/api/v3/texts/";
  const params = "?version=" + version +
                 "&return_format=strip_only_footnotes";

  var frame = document.getElementById("content");

  frame.replaceChildren();
  citations.forEach((citation, i) => {
    var url = baseUrl + citation + params;

    // Append the div to the container before calling the API to get its
    // content, because fetch is async and if we have more than one
    // citation the second one might finish before the first
    var contentDiv = document.createElement("div");
    contentDiv.className = "content-wrapper";
    frame.appendChild(contentDiv);

    fetch(url, options)
      .then(response => response.json())
      .then(response => WriteFrame(response, contentDiv))
      .catch(err => console.error(err));
  });
}

function WriteFrame(response, contentDiv) {
  // "sections" in the json give a reference to the beginning of the
  // returned text. If whole chapters are requested, the array is
  // length 1, and contains the first chapter. If the request begins
  // with a (possibly mid-chapter) verse, as it does implicitly when
  // making a request by parasha name, the array is length 2 and
  // includes chapter and verse.
  // sectionNames specifies the names of the units, but for our purposes
  // we can assume that they are always "chapter" and "verse" (or
  // "mishna", but that makes no practical difference at least for now)
  // We will use these for zero-based CSS counter-reset, so subtract 1
  var firstChapter = response.sections[0] - 1;
  var firstVerse =
      (response.sections.length > 1) ? response.sections[1] - 1: 0;

  // Create a heading for the text. Currently we are using the title
  // returned by the Sefaria API, which is not ideal: for example when
  // the citation is a parasha, it converts it to a from chapter and/
  // verse -- to chapter and verse citation, and that is what it returns
  // as title
  var h2 = document.createElement("h2");
  h2.className = "textHeading";
  h2.appendChild(document.createTextNode(response.heRef));
  h2.style.counterReset = "chapter-number " + firstChapter;
  contentDiv.appendChild(h2);

  // For multi-chapter selection, "text" in the json is an array of
  // chapters each containing an array of verses. For single-chapter
  // selection, it is not an array with one member containing an array of
  // verses, which would be consistent, but just an array of verses. To
  // handle this we use a helper function to which we always pass an array
  // of verses: in the first case we do this by looping through the array
  // of chapters, and in the second case we just pass it "text"
  if (Array.isArray(response.versions[0].text[0])) {
    response.versions[0].text.forEach((chapter, j) => {
      contentDiv.appendChild(LayoutChapter(chapter, j, firstVerse));
    });
  } else {
    contentDiv.appendChild(LayoutChapter(response.versions[0].text, 0, 0));
  }
}

function LayoutChapter(chapter, chapterIndex, firstVerse) {
  var div = document.createElement("div");
  if (chapterIndex == 0 && firstVerse != 0) {
    // This handles the case where our selection begins mid-chapter,
    // so we need to start the verse numbering from the verse returned
    // in "sections[1]"
    div.style.counterReset = "verse-number " + firstVerse;
  }

  div.className = "chapter";
  var h3 = document.createElement("h3");
  h3.className = "chapterHeading";
  h3.appendChild(document.createTextNode("פרק"));
  div.appendChild(h3);

  // Here we use innerHTML instead of createTextNode, because there is
  // some embedded HTML in the text returned (which we style with CSS)
  chapter.forEach((verse) => {
    var span = document.createElement("span");
    span.className = "verse";
    span.innerHTML = verse;
    div.appendChild(span);
  });

  return div;
}
