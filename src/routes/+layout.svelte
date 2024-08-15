<slot />

<style global>
  @font-face {
    font-family: 'montserrat';
    src: url(/fonts/montserrat.woff2) format('woff2');
    font-display: swap;
  }

  :root {
    --success: #32cd32;
    --success-dark: #218721;
    --error: #cd3232;
    --error-dark: #b40000;
    --primary: #03bdb7;
    --primary-light: #03e6e0;
    --primary-dark: #038279;
  }

  * {
    margin: 0;
    padding: 0;
    font-family: montserrat;
    list-style: none;
    color: white;
  }

  body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #161616;
    scroll-behavior: smooth;
  }

  header {
    height: 75px;
    position: fixed;
    top: 0;
  }

  footer {
    height: 20px;
  }

  main {
    position: relative;
    margin-top: 75px;
    flex: 1;
    overflow-y: auto;
  }

  a {
    -webkit-user-drag: none;
  }

  a:visited {
    text-decoration: none;
  }

  div,
  button {
    -webkit-tap-highlight-color: transparent;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #323232;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background-image: linear-gradient(var(--primary), var(--primary-light));
  }

  ::-webkit-scrollbar-thumb:hover {
    background-image: linear-gradient(var(--primary-dark), var(--primary));
  }

  input {
    padding: 5px;
    border-radius: 10px;
    border: 3px solid transparent;
    font-size: medium;
    outline: transparent;
  }

  input:focus {
    border: 3px solid #4d92d8;
  }

  button {
    padding: 10px 25px;
    border-radius: 50px;
    background-color: white;
    color: black;
    text-align: center;
    font-weight: bold;
    font-size: large;
    border: none;
    cursor: pointer;
  }

  @media (prefers-reduced-motion: reduce) {
    main {
      scroll-behavior: auto !important;
    }
  }

  img {
    -webkit-user-select: none;
    user-select: none;
  }
</style>
