function calculateScore({
views,
likes,
comments,
ageHours
}) {

let score = Math.floor(

```
(

  (
    likes +
    (comments * 2)
  )

  /

  (views || 1)

)

*

10000

*

(

  ageHours < 24
    ? 1.5
    : ageHours < 72
    ? 1.2
    : 1

)
```

);

return score;

}

function calculateStatus({
score,
velocity,
rankChange,
rank
}) {

let status = "stable";

if (
score >= 900 &&
velocity >= 30000 &&
rankChange >= 2
) {

```
status = "viral";
```

}

else if (
score >= 700 &&
velocity >= 15000
) {

```
status = "hot";
```

}

else if (
rankChange >= 3
) {

```
status = "rising";
```

}

else if (
rankChange <= -3
) {

```
status = "falling";
```

}

else if (
velocity >= 40000 &&
rank >= 15
) {

```
status = "hidden_gem";
```

}

else if (
rank === 1 &&
score >= 800
) {

```
status = "champion";
```

}

return status;

}

module.exports = {
calculateScore,
calculateStatus
};

