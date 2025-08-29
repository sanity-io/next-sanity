# before publish

```json
{
  "query": "_[_type == \"post\" \u0026\u0026 slug.current == $slug]{title,author-\u003e}",
  "result": [{"author": null, "title": "Test"}],
  "syncTags": ["s1:XMp5cQ"],
  "ms": 3
}
```

# live event after publish

```event-stream
id: MjA5NjY2MjAwfFkzczBNZUxmL1Rj
data: {"tags":["s1:0SlxPg","s1:XMp5cQ","s1:aaOaNA","s1:rFUIDQ","s1:uaAvjw"]}
```

# create author live event

```event-stream
id: MjA5NjY4NjY1fHRETFBSRll0aVpJ
data: {"tags":["s1:7/9iuA","s1:84gAkQ","s1:jFf4TA","s1:uaAvjw"]}
```

# assign author live event after publish

```event-stream
id: MjA5NjY5ODgyfGlJaG4zQ2I2M2dZ
data: {"tags":["s1:0SlxPg","s1:XMp5cQ","s1:aaOaNA","s1:rFUIDQ","s1:uaAvjw"]}
```

# query after publish

```json
{
  "query": "_[_type == \"post\" \u0026\u0026 slug.current == $slug]{title,author-\u003e}",
  "result": [
    {
      "author": {
        "_createdAt": "2025-08-22T09:16:53Z",
        "_id": "18c9ae1a-5c14-4ffe-b32e-8e488f043718",
        "_rev": "joSRntB3Eb5fEkYnP0uRf9",
        "_type": "author",
        "_updatedAt": "2025-08-22T09:17:37Z",
        "name": "Test author",
        "picture": {
          "_type": "image",
          "alt": "a computer generated image of a green swirl on a black background",
          "asset": {
            "_ref": "image-bcc7684cc81521607725dcc720fb260377c4a813-4000x6000-jpg",
            "_type": "reference"
          }
        }
      },
      "title": "Test"
    }
  ],
  "syncTags": ["s1:XMp5cQ", "s1:7/9iuA"],
  "ms": 6
}
```

# Edit author

```event-stream
id: MjA5NjcxMDAwfGk0WFNXMkx5ZE4w
data: {"tags":["s1:7/9iuA","s1:84gAkQ","s1:jFf4TA","s1:uaAvjw"]}
```

# payload

```json
{
  "query": "\*[_type == \"post\" && slug.current == $slug]{title,author-\u003E}",
  "result": [
    {
      "author": {
        "_createdAt": "2025-08-22T09:16:53Z",
        "_id": "18c9ae1a-5c14-4ffe-b32e-8e488f043718",
        "_rev": "EUEzHoCChULBs7NJ2BTdki",
        "_system": {
          "base": {"id": "18c9ae1a-5c14-4ffe-b32e-8e488f043718", "rev": "joSRntB3Eb5fEkYnP0uRf9"}
        },
        "_type": "author",
        "_updatedAt": "2025-08-22T09:20:51Z",
        "name": "Test Author",
        "picture": {
          "_type": "image",
          "alt": "a computer generated image of a green swirl on a black background",
          "asset": {
            "_ref": "image-bcc7684cc81521607725dcc720fb260377c4a813-4000x6000-jpg",
            "_type": "reference"
          }
        }
      },
      "title": "Test"
    }
  ],
  "syncTags": ["s1:XMp5cQ", "s1:7/9iuA"],
  "ms": 5
}
```
