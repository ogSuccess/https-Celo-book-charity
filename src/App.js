import React, { useEffect, useState } from "react";
// import { useContractKit, newKitFromWeb3 } from "@celo-tools/use-contractkit";
import { newKitFromWeb3 } from "@celo/contractkit";
import "@celo-tools/use-contractkit/lib/styles.css";
import Web3 from "@celo/contractkit/node_modules/web3";
import BigNumber from "bignumber.js";
import charityABI from "./contracts/Charity.abi.json";
import erc20Abi from "./contracts/erc20.abi.json";
const ContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
const CharityContractAddress = "0x6F536bd9c22293b1b672951A9BD383831a9e2F37";

export default function App() {
  const [loading, setloading] = useState(false);

  const [celoBalance, setCeloBalance] = useState(0);

  const [cUSDBalance, setcUSDBalance] = useState(0);
  const [books, setBooks] = useState([]);
  const [contract, setcontract] = useState(null);
  const [address, setAddress] = useState(null);
  const [kit, setKit] = useState(null);
  const [amountDonated, setAmountDonated] = useState(0);
  const [bookSold, setBookSold] = useState(0);

  const ERC20_DECIMALS = 18;
  useEffect(() => {
    // connect the users wallet
    connectCeloWallet();
  }, []);

  const connectCeloWallet = async () => {
    if (window.celo) {
      // notification("⚠️ Please approve this DApp to use it.")
      try {
        await window.celo.enable();
        // notificationOff()
        const web3 = new Web3(window.celo);
        let kit = newKitFromWeb3(web3);

        const accounts = await kit.web3.eth.getAccounts();
        const user_address = accounts[0];

        kit.defaultAccount = user_address;

        await setAddress(user_address);

        await setKit(kit);
      } catch (error) {
        console.log({ error });
        // notification(`⚠️ ${error}.`)
      }
    } else {
      console.log("please install the extension");
      // notification("⚠️ Please install the CeloExtensionWallet.")
    }
  };

  useEffect(() => {
    if (kit && address) {
      return getBalance();
    } else {
      console.log("no kit or address");
    }
  }, [kit, address]);

  const getBalance = async () => {
    const balance = await kit.getTotalBalance(address);
    const celoBalance = balance.CELO.shiftedBy(-ERC20_DECIMALS).toFixed(2);
    const USDBalance = balance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);

    const contract = new kit.web3.eth.Contract(
      charityABI,
      CharityContractAddress
    );

    console.log({ celoBalance, USDBalance });
    setcontract(contract);
    setCeloBalance(celoBalance);
    setcUSDBalance(USDBalance);
  };

  const getBooks = async () => {
    const _bookLength = await contract.methods.booksLength().call();
    const _books = [];

    for (let i = 0; i < _bookLength; i++) {
      let _b = new Promise(async (resolve, reject) => {
        let _book = await contract.methods.fetchBook(i).call();

        resolve({
          index: i,
          owner: _book[0],
          book_name: _book[1],
          cover_photo: _book[2],
          description: _book[3],
          price: new BigNumber(_book[4]),
          sales: _book[5],
          // price: new BigNumber(candidate[5]),
          // sold: candidate[6],
        });
      });
      _books.push(_b);
    }
    const all_books = await Promise.all(_books);
    let total_sales = 0;

    all_books.forEach((book) => {
      total_sales += book.sales;
    });
    

    setBookSold(Number(total_sales));
    setBooks(all_books);
  };

  useEffect(() => {
    if (contract) return getBooks();
  }, [contract]);

  useEffect(() => {
    // fetch total amout of cUSD donated
    if (contract) return fetchAmountDonated();
  }, [contract]);

  const fetchAmountDonated = async () => {
    const amount = await contract.methods.amountDonated().call();
    console.log({ amount });
    setAmountDonated(Number(amount));
  };

  const buyBook = async (_price, _index) => {
    try {
      const cUSDContract = new kit.web3.eth.Contract(erc20Abi, ContractAddress);

      const donation_price = new BigNumber(_price)
        .shiftedBy(ERC20_DECIMALS)
        .toString();

        console.log({donation_price})
      const result = await cUSDContract.methods
        .approve(CharityContractAddress, donation_price)
        .send({ from: address });

      await contract.methods.buyBook(_index).send({ from: address });
      // return result
      getBalance();
      getBooks();
    } catch (error) {
      console.log({ error });
    }
  };

  const donate = async (_price) => {
    try {
      const cUSDContract = new kit.web3.eth.Contract(erc20Abi, ContractAddress);
      const donation_price = new BigNumber(_price)
        .shiftedBy(ERC20_DECIMALS)
        .toString();
      console.log(typeof donation_price);

      const result = await cUSDContract.methods
        .approve(CharityContractAddress, donation_price)
        .send({ from: address });

      await contract.methods.donate(donation_price).send({ from: address });
      // return result
      getBalance();
    } catch (error) {
      console.log({ error });
    }
  };

  useEffect(() => {
    if (contract) return getBooks();
  }, [contract]);

  return (
    <div>
      <header>
        <div className="container-fluid p-0">
          <nav className="navbar navbar-expand-lg">
            <a className="navbar-brand" href="#">
              <i className="fas fa-book-reader fa-2x mx-3" />
              Books For Charity
            </a>
            <button
              className="navbar-toggler"
              type="button"
              data-toggle="collapse"
              data-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <i className="fas fa-align-right text-light" />
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <div className="mr-auto" />
              <ul className="navbar-nav">
                <li className="nav-item active">
                  <a className="nav-link" href="#home">
                    HOME
                    <span className="sr-only">(current)</span>
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#about">
                    ABOUT
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#stats">
                    STATS
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#donate">
                    DONATE
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#reviews">
                    REVIEWS
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#contact">
                    CONTACT
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="container text-center" id="home">
          <div className="row">
            <div className="col-md-7 col-sm-12  text-white">
              <h6>AUTHOR: CREATES BOOKS</h6>
              <h1>BUYERS HELP DONATE TO CHARITY</h1>
              <p>
                authors help create books for buyers who purchase, funds
                generated are fully donated for charity.
              </p>
              <button className="btn btn-light px-5 py-2 primary-btn">
                By now
              </button>
            </div>
            <div className="col-md-5 col-sm-12  h-25">
              <img src="/assets/header-img.png" alt="Book" />
            </div>
          </div>
        </div>
      </header>
      <main>
        <section className="section-1" id="about">
          <div className="container text-center">
            <div className="row">
              <div className="col-md-6 col-12">
                <div className="pray">
                  <img
                    src="/assets/pexels-photo-1904769.jpeg"
                    alt="Pray"
                    className
                  />
                </div>
              </div>
              <div className="col-md-6 col-12">
                <div className="panel text-left">
                  <h1>Mr. Success Oganiru</h1>
                  <p className="pt-4">
                    This project is dedicated for the dacade course learning
                    community for introduction to celo blockchain development
                    created by Success a learning student for the implementation
                    of what was learnt during the course.
                  </p>
                  <p>
                    The project is a minimal idea drawn from a use case for
                    charity. it brings together authors and readers who loves
                    charity. authors create amazing reads showcased for limited
                    amount of time where buyers get a value for thier donation
                    in form of having a copy of thier favourite books.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="section-2 container-fluid p-0" id="stats">
          <div className="cover">
            <div className="overlay" />
            <div className="content text-center">
              <h1>Have a look at statistics generated from the site</h1>
              <p>
                A display of fun stuff we,ve generated so far from users and
                authors.
              </p>
            </div>
          </div>
          <div className="container-fluid text-center">
            <div className="numbers d-flex flex-md-row flex-wrap justify-content-center">
              <div className="rect">
                <h1>{celoBalance}</h1>
                <p>Your Celo Balance</p>
              </div>
              <div className="rect">
                <h1>{cUSDBalance}</h1>
                <p>Your cUSD balance </p>
              </div>
              <div className="rect">
                <h1>{bookSold}</h1>
                <p>Total book sales</p>
              </div>
              <div className="rect">
                <h1>{amountDonated}</h1>
                <p>Funds raised in cUSD</p>
              </div>
            </div>
          </div>
          <div className="purchase text-center" id="buy">
            <h1>BOOKS NOW ON SALE</h1>
            <p>Buy this amazing reads and help donate to charity</p>
            <div className="cards">
              <div className="d-flex flex-row justify-content-center flex-wrap">
                {books &&
                  books.map((_book, key) => (
                    <div className="card">
                      <div className="card-body">
                        <div className="title">
                          <h5 className="card-title">{_book.book_name}</h5>
                        </div>
                        <p className="card-text">{_book.description}</p>

                        <p className="card-text">
                          Number of Sales : {_book.sales}
                        </p>
                        <div className="pricing">
                          <h1>{_book.price.toString()} cUSD</h1>
                          <a
                            href="#"
                            className="btn btn-dark px-5 py-2 primary-btn mb-5"
                            onClick={(e) => {
                              e.preventDefault();
                              buyBook(_book.price, _book.index);
                            }}
                          >
                            Purchase Now
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>
        <section
          className="section-3 container-fluid p-0 text-center"
          id="donate"
        >
          <div className="row">
            <div className="col-md-12 col-sm-12">
              <h1>Don't feel you need a book but still wish to donate?</h1>
              <p>
                We understand not everyone needs a book but would love to give
                to charity, no worries you can donate directly from below we
                made it easy to do by choosing any of the plans below that
                suites your donation chioce.
              </p>
            </div>
          </div>
          <div className="platform row">
            <div className="col-md-6 col-sm-12 text-right">
              <div className="desktop shadow-lg">
                <div className="d-flex flex-row justify-content-center">
                  <div
                    className="text text-center"
                    onClick={(e) => {
                      e.preventDefault();
                      donate(2);
                    }}
                  >
                    <h3 href="#" className=" pt-1 m-0">
                      CLICK TO DONATE
                    </h3>
                    <p className="p-0 m-0">2 cUSD</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-sm-12 text-left">
              <div className="desktop shadow-lg">
                <div className="d-flex flex-row justify-content-center">
                  <div
                    className="text text-center"
                    onClick={(e) => {
                      e.preventDefault();
                      donate(5);
                    }}
                  >
                    <h3 href="#" className=" pt-1 m-0">
                      CLICK TO DONATE
                    </h3>

                    <p className="p-0 m-0">5 cUSD</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Section 4 */}
        <section className="section-4" id="reviews">
          <div className="container text-center">
            <h1 className="text-dark">What our readers Say about us</h1>
            <p className="text-secondary">
              Our amazing readers from around the globe have something to say
            </p>
          </div>
          <div className="team row ">
            <div className="col-md-4 col-12 text-center">
              <div className="card mr-2 d-inline-block shadow-lg">
                <div className="card-img-top">
                  <img
                    src="/assets/UI-face-3.jpg"
                    className="img-fluid border-radius p-4"
                    alt=""
                  />
                </div>
                <div className="card-body">
                  <h3 className="card-title">Blalock Jolene</h3>
                  <p className="card-text">
                    Amazing platform books are best selected and educative, i
                    found a fun way to donate to charity why doing what i love.
                  </p>
                  <a href="#" className="text-secondary text-decoration-none">
                    Blalock Jolene
                  </a>
                  <p className="text-black-50">Reader</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-12">
              <div
                id="carouselExampleControls"
                className="carousel slide "
                data-ride="carousel"
              >
                <div className="carousel-inner text-center">
                  <div className="carousel-item active">
                    <div className="card mr-2 d-inline-block shadow">
                      <div className="card-img-top">
                        <img
                          src="/assets/UI-face-1.jpg"
                          className="img-fluid rounded-circle w-50 p-4"
                          alt=""
                        />
                      </div>
                      <div className="card-body">
                        <h3 className="card-title">Allen Agnes</h3>
                        <p className="card-text">
                          Nothing beats this experience getting real value for
                          donation, i have some bulks i run this up, always
                          exciting books on sale.
                        </p>
                        <a
                          href="#"
                          className="text-secondary text-decoration-none"
                        >
                          Allen Agnes
                        </a>
                        <p className="text-black-50">Reader</p>
                      </div>
                    </div>
                  </div>
                  <div className="carousel-item">
                    <div className="card  d-inline-block mr-2 shadow">
                      <div className="card-img-top">
                        <img
                          src="/assets/UI-face-2.jpg"
                          className="img-fluid rounded-circle w-50 p-4"
                          alt=""
                        />
                      </div>
                      <div className="card-body">
                        <h3 className="card-title">Amiel Barbara</h3>
                        <p className="card-text">
                          Been donatng a yers now and feels good to see some
                          books i crazed to read on the platform love the
                          feature for those who still wish to donate without
                          buying a book.
                        </p>
                        <a
                          href="#"
                          className="text-secondary text-decoration-none"
                        >
                          Amiel Barbara
                        </a>
                        <p className="text-black-50">Reader</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-12 text-center">
              <div className="card mr-2 d-inline-block shadow-lg">
                <div className="card-img-top">
                  <img
                    src="/assets/UI-face-4.jpg"
                    className="img-fluid border-radius p-4"
                    alt=""
                  />
                </div>
                <div className="card-body">
                  <h3 className="card-title">Olivia Louis</h3>
                  <p className="card-text">
                    I love the transparency and fact readers hlep to change
                    lives around the world by doing what they love.
                  </p>
                  <a href="#" className="text-secondary text-decoration-none">
                    Olivia Louis
                  </a>
                  <p className="text-black-50">Reader</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className="container-fluid p-0" id="contact">
          <div className="row text-left">
            <div className="col-md-5 col-sm-5">
              <h4 className="text-light">About me</h4>
              <p className="text-muted">
                yeah i took the course, built something that you love. Don't you{" "}
              </p>
              <p className="pt-4 text-muted">
                Copyright ©2021 All rights reserved |
                <span>intro to celo Dev</span>
              </p>
            </div>
            <div className="col-md-5 col-sm-12">
              <h4 className="text-light">Newsletter</h4>
              <p className="text-muted">Stay Updated</p>
              <form className="form-inline">
                <div className="col pl-0">
                  <div className="input-group pr-5">
                    <input
                      type="text"
                      className="form-control bg-dark text-white"
                      id="inlineFormInputGroupUsername2"
                      placeholder="Email"
                    />
                    <div className="input-group-prepend">
                      <div className="input-group-text">
                        <i className="fas fa-arrow-right" />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="col-md-2 col-sm-12">
              <h4 className="text-light">Follow Us</h4>
              <p className="text-muted">Let us be social</p>
              <div className="column text-light">
                <i className="fab fa-facebook-f" />
                <i className="fab fa-instagram" />
                <i className="fab fa-twitter" />
                <i className="fab fa-youtube" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
