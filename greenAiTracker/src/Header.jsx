import leafLogo from './assets/leaf-logo.svg';


function Header() {
    return (
        
        <header className="site-header">
            
            <img className="site-logo" src={leafLogo} alt="" width="32" height="28" />
            <h1 className='site-title'>Green AI Tracker</h1>

            <nav className='site-nav'>
                <ul>
                    <li>
                        <a className="nav-link" href="/dashboard">Dashboard</a>
                    </li>
                    <li>
                        <a className="nav-link" href="/Information">Information</a>
                    </li>
                    <li>
                        <a className="nav-link nav-link--active" href="/profile" aria-current="page">Profile</a>
                    </li>
                    <li>
                          <select id="defaultLanguage" name="defaultLanguage" defaultValue="English" aria-label="Language">
                            <option value="English" selected>English</option>
                            <option value="Spanish">Española</option>
                            <option value="French">Français</option>
                        </select>
                    </li>
                </ul>
            </nav>
        </header>
    );
}
;

export default Header