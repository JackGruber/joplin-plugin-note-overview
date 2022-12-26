# Codeblock check

## Ignore 1

```
<!-- note-overview-plugin
search: type:todo iscompleted:0 notebook:"2 - NEXT" tag:pro
fields: title, created_time, body, todo_due, tags
sort: created_time ASC
-->
```

## Ignore 2 with space

``` 
<!-- note-overview-plugin
search: type:todo iscompleted:0 notebook:"2 - NEXT" tag:pro
fields: title, created_time, body, todo_due, tags
sort: created_time ASC
-->
```

## Ignore 3

```
<!-- note-overview-plugin
search: -tag:*
fields: updated_time, title, notebook
alias: updated_time AS Edit
sort: updated_time DESC
-->
| Edit | title | notebook |
| --- | --- | --- |
|24/08/2021 20:56|[Note 1](:/2f9c4c5803974a85bb1891e2bcf1903f)|Import|
|24/08/2021 12:54|[Note 2](:/74173316718d44668a73e17aeb97a69a)|Import|
<!--endoverview-->
```

## Match 1

```
Some Code
```

<!-- note-overview-plugin
search: type:todo iscompleted:0 notebook:"3 - WAITING" tag:pro
fields: title, created_time, body, todo_due, tags
sort: created_time ASC
-->

## Match 2

<!-- note-overview-plugin
search: type:todo iscompletetd:0 notebook:"5 - SOMEDAY / MAYBE" tag:pro
fields: title, created_time
sort: created_time ASC
-->

```
Code
```
